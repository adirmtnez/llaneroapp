import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'

export interface UseRealTimeOrdersOptions {
  refreshInterval?: number // en milisegundos, default 30 segundos
  onNewOrder?: (newOrder: any) => void
  enabled?: boolean
}

export function useRealTimeOrders<T>(
  loadOrdersFunction: () => Promise<{ orders: T[], error: string | null }>,
  options: UseRealTimeOrdersOptions = {}
) {
  const {
    refreshInterval = 30000, // 30 segundos por defecto
    onNewOrder,
    enabled = true
  } = options

  const [orders, setOrders] = useState<T[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [newOrdersCount, setNewOrdersCount] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
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
      
      console.log('🔄 Cargando pedidos en tiempo real...')
      const { orders: newOrders, error: loadError } = await loadOrdersFunction()
      
      if (loadError) {
        setError(loadError)
        console.error('❌ Error cargando pedidos:', loadError)
      } else {
        // Detectar nuevos pedidos y cambios
        if (!isInitialLoadRef.current) {
          // Detectar nuevos pedidos
          if (newOrders.length > previousOrdersCountRef.current) {
            const newOrdersDetected = newOrders.length - previousOrdersCountRef.current
            console.log(`🆕 ${newOrdersDetected} nuevos pedidos detectados`)
            
            setNewOrdersCount(prev => prev + newOrdersDetected)
            
            // Notificar nuevos pedidos
            if (onNewOrder && newOrders.length > 0) {
              onNewOrder(newOrders[0]) // Pasar el pedido más reciente
            }
            
            // Mostrar toast notification
            toast.success(`¡${newOrdersDetected} nuevo${newOrdersDetected > 1 ? 's' : ''} pedido${newOrdersDetected > 1 ? 's' : ''} recibido${newOrdersDetected > 1 ? 's' : ''}!`, {
              duration: 5000,
            })
          }
          
          // Detectar cambios en pedidos existentes (ej: cambio de estado)
          if (previousOrdersRef.current.length > 0 && newOrders.length === previousOrdersCountRef.current) {
            const changedOrders = newOrders.filter((newOrder: any) => {
              const previousOrder = previousOrdersRef.current.find((prev: any) => prev.id === newOrder.id)
              return previousOrder && JSON.stringify(previousOrder) !== JSON.stringify(newOrder)
            })
            
            if (changedOrders.length > 0) {
              console.log(`🔄 ${changedOrders.length} pedidos actualizados`)
              // Opcional: mostrar notificación más sutil para cambios
              toast.info(`${changedOrders.length} pedido${changedOrders.length > 1 ? 's' : ''} actualizado${changedOrders.length > 1 ? 's' : ''}`, {
                duration: 3000,
              })
            }
          }
        }
        
        setOrders(newOrders)
        previousOrdersCountRef.current = newOrders.length
        previousOrdersRef.current = [...newOrders] // Guardar copia para detectar cambios
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
  }, [loadOrdersFunction, onNewOrder])

  // Función para refrescar manualmente
  const refresh = useCallback(() => {
    loadOrders(false) // No mostrar loading en refresh manual
  }, [loadOrders])

  // Función para marcar nuevos pedidos como vistos
  const markNewOrdersAsSeen = useCallback(() => {
    setNewOrdersCount(0)
  }, [])

  // Función para pausar/reanudar (definir primero)
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log('⏸️ Polling pausado')
    }
  }, [])

  const resume = useCallback(() => {
    if (!intervalRef.current && enabled) {
      intervalRef.current = setInterval(() => {
        console.log('⏰ Auto-refresh de pedidos...')
        loadOrders(false)
      }, refreshInterval)
      console.log('▶️ Polling reanudado')
    }
  }, [enabled, refreshInterval, loadOrders])

  // Configurar polling
  useEffect(() => {
    if (!enabled) return

    // Carga inicial
    loadOrders()

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      console.log('⏰ Auto-refresh de pedidos...')
      loadOrders(false) // No mostrar loading en auto-refresh
    }, refreshInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, refreshInterval, loadOrders])

  // Pausar polling cuando la pestaña no está visible (optimización de recursos)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('🔇 Pestaña no visible - pausando polling')
        pause()
      } else {
        console.log('👁️ Pestaña visible - reanudando polling')
        resume()
        // Refrescar inmediatamente al volver a la pestaña
        loadOrders(false)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pause, resume, loadOrders])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
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
    pause,
    resume
  }
}