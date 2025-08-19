import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface UseSupabaseRealtimeOrdersOptions {
  onNewOrder?: (newOrder: any) => void
  onOrderUpdate?: (updatedOrder: any) => void
  enabled?: boolean
  userId?: string // Para filtrar solo pedidos del usuario (en app cliente)
}

export function useSupabaseRealtimeOrders<T>(
  loadOrdersFunction: () => Promise<{ orders: T[], error: string | null }>,
  options: UseSupabaseRealtimeOrdersOptions = {}
) {
  const {
    onNewOrder,
    onOrderUpdate,
    enabled = true,
    userId
  } = options

  const [orders, setOrders] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  
  const supabaseRef = useRef<any>(null)
  const channelRef = useRef<any>(null)
  const previousOrdersCountRef = useRef<number>(0)
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
        previousOrdersCountRef.current = newOrders.length
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

  // Configurar Supabase Realtime
  useEffect(() => {
    if (!enabled) return

    // Carga inicial
    loadOrders()

    // Crear cliente Supabase para realtime
    supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10, // Limitar eventos para performance
        }
      }
    })

    // Configurar canal de realtime
    const tableName = 'orders'
    const channelName = userId ? `orders-user-${userId}` : 'orders-admin'
    
    channelRef.current = supabaseRef.current
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar todos los eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: tableName,
          // Filtrar por usuario si se especifica
          ...(userId && {
            filter: `customer_id=eq.${userId}`
          })
        },
        (payload: any) => {
          console.log('🔥 Supabase Realtime event:', payload)
          handleRealtimeEvent(payload)
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Supabase Realtime status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Supabase Realtime conectado exitosamente')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error en canal Supabase Realtime')
        }
      })

    return () => {
      console.log('📡 Desconectando Supabase Realtime...')
      if (channelRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
    }
  }, [enabled, userId, loadOrders])

  // Manejar eventos de realtime
  const handleRealtimeEvent = useCallback(async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        console.log('🆕 Nuevo pedido detectado via Realtime:', newRecord)
        
        // Incrementar contador de nuevos pedidos
        if (!isInitialLoadRef.current) {
          setNewOrdersCount(prev => prev + 1)
          
          // Callback para nuevo pedido
          if (onNewOrder) {
            onNewOrder(newRecord)
          }
          
          // Toast notification
          toast.success('¡Nuevo pedido recibido!', {
            duration: 5000,
            description: `Pedido #${newRecord.order_number || newRecord.id}`
          })
        }
        
        // Recargar para obtener datos completos con JOINs
        await loadOrders(false)
        break

      case 'UPDATE':
        console.log('🔄 Pedido actualizado via Realtime:', newRecord)
        
        // Callback para pedido actualizado
        if (onOrderUpdate) {
          onOrderUpdate(newRecord)
        }
        
        // Toast notification más sutil
        if (!isInitialLoadRef.current) {
          toast.info('Pedido actualizado', {
            duration: 3000,
            description: `Pedido #${newRecord.order_number || newRecord.id}`
          })
        }
        
        // Recargar para obtener datos completos
        await loadOrders(false)
        break

      case 'DELETE':
        console.log('🗑️ Pedido eliminado via Realtime:', oldRecord)
        
        // Recargar lista
        await loadOrders(false)
        break

      default:
        console.log('❓ Evento Realtime desconocido:', eventType)
    }
  }, [onNewOrder, onOrderUpdate, loadOrders])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (channelRef.current && supabaseRef.current) {
        supabaseRef.current.removeChannel(channelRef.current)
      }
    }
  }, [])

  return {
    orders,
    isLoading,
    error,
    lastUpdateTime,
    newOrdersCount,
    refresh,
    markNewOrdersAsSeen,
    // Información adicional sobre Realtime
    isRealtimeConnected: channelRef.current?.state === 'joined'
  }
}