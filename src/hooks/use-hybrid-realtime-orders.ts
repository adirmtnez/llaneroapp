import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export interface UseHybridRealtimeOrdersOptions {
  refreshInterval?: number // Fallback polling interval (default: 60s)
  onNewOrder?: (newOrder: any) => void
  onOrderUpdate?: (updatedOrder: any) => void
  enabled?: boolean
  userId?: string // Para filtrar solo pedidos del usuario
  useSupabaseRealtime?: boolean // Feature flag para habilitar/deshabilitar realtime
}

export function useHybridRealtimeOrders<T>(
  loadOrdersFunction: () => Promise<{ orders: T[], error: string | null }>,
  options: UseHybridRealtimeOrdersOptions = {}
) {
  const {
    refreshInterval = 60000, // 60 segundos como fallback
    onNewOrder,
    onOrderUpdate,
    enabled = true,
    userId,
    useSupabaseRealtime = false // Por defecto usar polling hasta que Realtime esté configurado
  } = options

  const [orders, setOrders] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  const [connectionType, setConnectionType] = useState<'polling' | 'realtime' | 'hybrid'>('polling')
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const supabaseChannelRef = useRef<any>(null)
  const previousOrdersCountRef = useRef<number>(0)
  const previousOrdersRef = useRef<T[]>([])
  const isInitialLoadRef = useRef(true)

  // Función para cargar pedidos
  const loadOrders = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      }
      setError(null)
      
      console.log(`🔄 Cargando pedidos (${connectionType})...`)
      const { orders: newOrders, error: loadError } = await loadOrdersFunction()
      
      if (loadError) {
        setError(loadError)
        console.error('❌ Error cargando pedidos:', loadError)
      } else {
        // Detectar cambios solo en modo polling
        if (connectionType === 'polling' && !isInitialLoadRef.current) {
          await detectChanges(newOrders)
        }
        
        setOrders(newOrders)
        previousOrdersCountRef.current = newOrders.length
        previousOrdersRef.current = [...newOrders]
        setLastUpdateTime(new Date())
        console.log('✅ Pedidos actualizados:', newOrders.length)
      }
    } catch (err) {
      console.error('💥 Error inesperado:', err)
      setError('Error inesperado al cargar pedidos')
    } finally {
      setIsLoading(false)
      isInitialLoadRef.current = false
    }
  }, [loadOrdersFunction, connectionType])

  // Detectar cambios en modo polling
  const detectChanges = useCallback(async (newOrders: T[]) => {
    // Detectar nuevos pedidos
    if (newOrders.length > previousOrdersCountRef.current) {
      const newOrdersDetected = newOrders.length - previousOrdersCountRef.current
      console.log(`🆕 ${newOrdersDetected} nuevos pedidos detectados (polling)`)
      
      setNewOrdersCount(prev => prev + newOrdersDetected)
      
      if (onNewOrder && newOrders.length > 0) {
        onNewOrder(newOrders[0])
      }
      
      toast.success(`¡${newOrdersDetected} nuevo${newOrdersDetected > 1 ? 's' : ''} pedido${newOrdersDetected > 1 ? 's' : ''} recibido${newOrdersDetected > 1 ? 's' : ''}!`, {
        duration: 5000,
      })
    }
    
    // Detectar cambios en pedidos existentes
    if (previousOrdersRef.current.length > 0 && newOrders.length === previousOrdersCountRef.current) {
      const changedOrders = newOrders.filter((newOrder: any) => {
        const previousOrder = previousOrdersRef.current.find((prev: any) => prev.id === newOrder.id)
        return previousOrder && JSON.stringify(previousOrder) !== JSON.stringify(newOrder)
      })
      
      if (changedOrders.length > 0) {
        console.log(`🔄 ${changedOrders.length} pedidos actualizados (polling)`)
        if (onOrderUpdate && changedOrders[0]) {
          onOrderUpdate(changedOrders[0])
        }
        toast.info(`${changedOrders.length} pedido${changedOrders.length > 1 ? 's' : ''} actualizado${changedOrders.length > 1 ? 's' : ''}`, {
          duration: 3000,
        })
      }
    }
  }, [onNewOrder, onOrderUpdate])

  // Configurar Supabase Realtime (cuando esté habilitado)
  const setupSupabaseRealtime = useCallback(async () => {
    if (!useSupabaseRealtime) return

    try {
      console.log('🔥 Configurando Supabase Realtime...')
      
      // Aquí iría la configuración de Supabase Realtime
      // Por ahora simular que está configurado
      setConnectionType('realtime')
      
      // TODO: Implementar canal Supabase
      /*
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(...)
      
      supabaseChannelRef.current = supabase
        .channel(`orders-${userId || 'admin'}`)
        .on('postgres_changes', { ... }, handleRealtimeEvent)
        .subscribe()
      */
      
      console.log('✅ Supabase Realtime configurado')
    } catch (error) {
      console.error('❌ Error configurando Realtime, fallback a polling:', error)
      setConnectionType('polling')
    }
  }, [useSupabaseRealtime, userId])

  // Configurar polling
  const setupPolling = useCallback(() => {
    if (intervalRef.current) return

    console.log(`⏰ Configurando polling cada ${refreshInterval / 1000}s...`)
    setConnectionType('polling')
    
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        console.log('⏰ Auto-refresh (polling)...')
        loadOrders(false)
      }
    }, refreshInterval)
  }, [refreshInterval, loadOrders])

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    loadOrders(false)
  }, [loadOrders])

  // Función para marcar nuevos pedidos como vistos
  const markNewOrdersAsSeen = useCallback(() => {
    setNewOrdersCount(0)
  }, [])

  // Alternar entre Realtime y Polling
  const toggleConnectionType = useCallback(() => {
    if (connectionType === 'polling') {
      setupSupabaseRealtime()
    } else {
      if (supabaseChannelRef.current) {
        // Desconectar Realtime
        supabaseChannelRef.current = null
      }
      setConnectionType('polling')
      setupPolling()
    }
  }, [connectionType, setupSupabaseRealtime, setupPolling])

  // Configuración inicial
  useEffect(() => {
    if (!enabled) return

    // Carga inicial
    loadOrders()

    // Configurar conexión
    if (useSupabaseRealtime) {
      setupSupabaseRealtime()
    } else {
      setupPolling()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (supabaseChannelRef.current) {
        // Cleanup Supabase channel
        supabaseChannelRef.current = null
      }
    }
  }, [enabled, useSupabaseRealtime, setupSupabaseRealtime, setupPolling, loadOrders])

  // Pausa automática por visibilidad (solo en polling)
  useEffect(() => {
    if (connectionType !== 'polling') return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔇 Pestaña no visible - pausando polling')
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      } else {
        console.log('👁️ Pestaña visible - reanudando polling')
        setupPolling()
        loadOrders(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connectionType, setupPolling, loadOrders])

  return {
    orders,
    isLoading,
    error,
    lastUpdateTime,
    newOrdersCount,
    refresh,
    markNewOrdersAsSeen,
    // Información adicional
    connectionType,
    toggleConnectionType,
    isRealtimeEnabled: useSupabaseRealtime
  }
}