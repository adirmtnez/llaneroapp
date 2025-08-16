import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export interface UseRealtimeOrdersOptions {
  onNewOrder?: (newOrder: Record<string, unknown>) => void
  onOrderUpdate?: (updatedOrder: Record<string, unknown>) => void
  onOrderDelete?: (deletedOrder: Record<string, unknown>) => void
  enabled?: boolean
  userId?: string // Para filtrar solo pedidos del usuario (en app cliente)
  fallbackToPolling?: boolean // Si falla Realtime, usar polling
  pollingInterval?: number // Intervalo de polling como fallback (default: 30s)
}

export function useRealtimeOrders<T>(
  loadOrdersFunction: () => Promise<{ orders: T[], error: string | null }>,
  options: UseRealtimeOrdersOptions = {}
) {
  const {
    onNewOrder,
    onOrderUpdate,
    onOrderDelete,
    enabled = true,
    userId,
    fallbackToPolling = true,
    pollingInterval = 30000
  } = options

  const [orders, setOrders] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [connectionType, setConnectionType] = useState<'realtime' | 'polling' | 'disconnected'>('disconnected')
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [usingFallback, setUsingFallback] = useState(false)
  
  const supabaseRef = useRef<unknown>(null)
  const channelRef = useRef<unknown>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialLoadRef = useRef(true)

  // Función para cargar pedidos
  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      
      console.log('🔄 Cargando pedidos con Supabase Realtime...')
      const { orders: newOrders, error: loadError } = await loadOrdersFunction()
      
      if (loadError) {
        setError(loadError)
        console.error('❌ Error cargando pedidos:', loadError)
      } else {
        setOrders(newOrders)
        setLastUpdateTime(new Date())
        console.log('✅ Pedidos cargados:', newOrders.length)
      }
    } catch (err) {
      console.error('💥 Error inesperado:', err)
      setError('Error inesperado al cargar pedidos')
    } finally {
      setIsLoading(false)
      isInitialLoadRef.current = false
    }
  }, [loadOrdersFunction])

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    loadOrders(false)
  }, [loadOrders])

  // Función para marcar nuevos pedidos como vistos
  const markNewOrdersAsSeen = useCallback(() => {
    setNewOrdersCount(0)
  }, [])

  // Función para iniciar polling como fallback
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    console.log('🔄 Iniciando polling fallback cada', pollingInterval / 1000, 'segundos')
    setUsingFallback(true)
    setConnectionType('polling')
    
    const startPolling = async () => {
      try {
        console.log('📡 Polling: Verificando nuevos pedidos...')
        const { orders: newOrders, error: loadError } = await loadOrdersFunction()
        
        if (loadError) {
          console.error('❌ Error en polling:', loadError)
        } else {
          setOrders(newOrders)
          setLastUpdateTime(new Date())
        }
      } catch (err) {
        console.error('💥 Error inesperado en polling:', err)
      }
    }
    
    // Ejecutar inmediatamente y luego en intervalo
    startPolling()
    pollingIntervalRef.current = setInterval(startPolling, pollingInterval)
  }, [pollingInterval, loadOrdersFunction])

  // Función para detener polling
  const stopPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Deteniendo polling fallback')
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    setUsingFallback(false)
  }, [])

  // Manejar eventos de Supabase Realtime
  const handleRealtimeEvent = useCallback(async (payload: Record<string, unknown>) => {
    const { eventType, new: newRecord, old: oldRecord } = payload as {
      eventType: string
      new: Record<string, unknown>
      old: Record<string, unknown>
    }
    
    console.log('🔥 Supabase Realtime event:', { eventType, newRecord, oldRecord })

    switch (eventType) {
      case 'INSERT':
        console.log('🆕 Nuevo pedido via Realtime:', (newRecord.order_number as string) || (newRecord.id as string))
        
        // Solo mostrar notificación después de la carga inicial
        if (!isInitialLoadRef.current) {
          setNewOrdersCount(prev => prev + 1)
          
          // Callback personalizado
          if (onNewOrder) {
            onNewOrder(newRecord)
          }
          
          // Toast notification
          toast.success('¡Nuevo pedido recibido!', {
            duration: 5000,
            description: `Pedido #${(newRecord.order_number as string) || (newRecord.id as string)}`
          })
        }
        
        // Recargar para obtener datos completos con JOINs
        await loadOrders(false)
        break

      case 'UPDATE':
        console.log('🔄 Pedido actualizado via Realtime:', (newRecord.order_number as string) || (newRecord.id as string))
        
        // Callback personalizado
        if (onOrderUpdate) {
          onOrderUpdate(newRecord)
        }
        
        // Toast notification más sutil para actualizaciones
        if (!isInitialLoadRef.current) {
          toast.info('Pedido actualizado', {
            duration: 3000,
            description: `Pedido #${(newRecord.order_number as string) || (newRecord.id as string)}`
          })
        }
        
        // Recargar para obtener datos completos
        await loadOrders(false)
        break

      case 'DELETE':
        console.log('🗑️ Pedido eliminado via Realtime:', (oldRecord?.order_number as string) || (oldRecord?.id as string))
        
        // Callback personalizado
        if (onOrderDelete) {
          onOrderDelete(oldRecord)
        }
        
        // Toast notification
        if (!isInitialLoadRef.current) {
          toast.info('Pedido eliminado', {
            duration: 3000,
            description: `Pedido #${(oldRecord?.order_number as string) || (oldRecord?.id as string)}`
          })
        }
        
        // Recargar lista
        await loadOrders(false)
        break

      default:
        console.log('❓ Evento Realtime desconocido:', eventType)
    }
  }, [onNewOrder, onOrderUpdate, onOrderDelete, loadOrders])

  // Configurar Supabase Realtime
  useEffect(() => {
    if (!enabled) return

    let supabase: unknown = null
    let channel: unknown = null

    const setupRealtime = async () => {
      try {
        // Carga inicial
        await loadOrders()

        // Por ahora solo cargar datos inicialmente sin polling automático
        console.log('✅ Carga inicial completada')

        // Crear cliente Supabase para realtime
        const { createClient } = await import('@supabase/supabase-js')
        
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            realtime: {
              params: {
                eventsPerSecond: 20, // Permitir hasta 20 eventos por segundo
              }
            }
          }
        )

        supabaseRef.current = supabase

        // Configurar canal de realtime
        const channelName = userId ? `orders-user-${userId}` : 'orders-admin'
        
        console.log('📡 Configurando canal Supabase Realtime:', channelName)
        
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*', // Escuchar INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'orders',
              // Filtrar por usuario en el cliente si se especifica
              ...(userId && {
                filter: `customer_id=eq.${userId}`
              })
            },
            handleRealtimeEvent
          )
          .subscribe((status: string) => {
            console.log('📡 Supabase Realtime status:', status)
            
            switch (status) {
              case 'SUBSCRIBED':
                console.log('✅ Supabase Realtime conectado exitosamente')
                setIsRealtimeConnected(true)
                setConnectionType('realtime')
                setConnectionAttempts(0)
                setError(null)
                // Detener polling si estaba activo
                stopPollingFallback()
                break
              case 'CHANNEL_ERROR':
                console.error('❌ Error en canal Supabase Realtime')
                setIsRealtimeConnected(false)
                setError('Error de conexión Realtime')
                // Activar fallback inmediatamente
                if (fallbackToPolling) {
                  console.log('🔄 Activando polling fallback por error de canal')
                  startPollingFallback()
                }
                break
              case 'TIMED_OUT':
                console.error('⏰ Timeout en Supabase Realtime')
                setIsRealtimeConnected(false)
                setError('Timeout de conexión Realtime')
                // Activar fallback inmediatamente en timeout
                if (fallbackToPolling) {
                  console.log('🔄 Activando polling fallback por timeout')
                  startPollingFallback()
                }
                break
              case 'CLOSED':
                console.log('📡 Canal Supabase Realtime cerrado')
                setIsRealtimeConnected(false)
                // Activar fallback inmediatamente
                if (fallbackToPolling) {
                  console.log('🔄 Activando polling fallback por canal cerrado')
                  startPollingFallback()
                }
                break
            }
          })

        channelRef.current = channel

      } catch (err) {
        console.error('💥 Error configurando Supabase Realtime:', err)
        setError('Error configurando conexión en tiempo real')
        setIsRealtimeConnected(false)
        
        // Activar fallback inmediatamente si falla la configuración inicial
        if (fallbackToPolling) {
          console.log('🔄 Activando polling fallback debido a error de configuración')
          setTimeout(() => startPollingFallback(), 1000)
        }
      }
    }

    setupRealtime()

    // Cleanup
    return () => {
      console.log('📡 Desconectando Supabase Realtime...')
      setIsRealtimeConnected(false)
      
      if (channel) {
        supabase?.removeChannel(channel)
      }
      
      // Detener polling si estaba activo
      stopPollingFallback()
    }
  }, [enabled, userId, loadOrders, handleRealtimeEvent])

  // Función para reconectar manualmente
  const reconnect = useCallback(() => {
    console.log('🔄 Reconectando manualmente...')
    
    // Resetear estados
    setConnectionAttempts(0)
    setIsRealtimeConnected(false)
    setError(null)
    
    // Detener polling si estaba activo
    stopPollingFallback()
    
    // Recargar datos
    loadOrders(false)
  }, [loadOrders, stopPollingFallback])

  // Cleanup al desmontar componente
  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        console.log('🧹 Cleanup final Supabase Realtime')
        supabaseRef.current.removeChannel(channelRef.current)
      }
      stopPollingFallback()
    }
  }, [stopPollingFallback])

  return {
    orders,
    isLoading,
    error,
    lastUpdateTime,
    newOrdersCount,
    refresh,
    markNewOrdersAsSeen,
    reconnect,
    // Estado específico de Realtime
    isRealtimeConnected,
    connectionType,
    usingFallback,
    connectionAttempts
  }
}