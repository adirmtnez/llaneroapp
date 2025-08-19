'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CompleteOrder } from '@/utils/orders-service'

// 📡 SMART REALTIME: Conexiones WebSocket inteligentes con cleanup automático
interface UseSmartRealtimeOptions {
  userId: string
  onOrderUpdate: (update: Partial<CompleteOrder>) => void
  shouldConnect: boolean // Solo conectar cuando sea realmente necesario
  fallbackToPolling: () => void // Callback para fallback a polling
}

interface RealtimeState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connectionAttempts: number
  lastHeartbeat: number
}

const MAX_RECONNECT_ATTEMPTS = 3
const HEARTBEAT_INTERVAL = 30000 // 30 segundos
const CONNECTION_TIMEOUT = 10000 // 10 segundos

export function useSmartRealtimeOrders({
  userId,
  onOrderUpdate,
  shouldConnect,
  fallbackToPolling
}: UseSmartRealtimeOptions) {
  
  const [state, setState] = useState<RealtimeState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    connectionAttempts: 0,
    lastHeartbeat: 0
  })

  const channelRef = useRef<RealtimeChannel | null>(null)
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldConnectRef = useRef(shouldConnect)

  // Actualizar referencia cuando cambie shouldConnect
  useEffect(() => {
    shouldConnectRef.current = shouldConnect
  }, [shouldConnect])

  // 🏗️ Crear cliente Supabase para Realtime (solo cuando sea necesario)
  const createRealtimeClient = useCallback(() => {
    if (clientRef.current) return clientRef.current

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 5, // Limitar eventos para no saturar
          },
        },
        auth: {
          persistSession: false, // No persistir para conexiones Realtime
        },
      })

      clientRef.current = client
      console.log('📡 Cliente Realtime creado exitosamente')
      return client
      
    } catch (error) {
      console.error('❌ Error creando cliente Realtime:', error)
      setState(prev => ({ ...prev, error: 'Error creando cliente Realtime' }))
      return null
    }
  }, [])

  // 💓 Sistema de heartbeat para detectar conexiones zombie
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    
    heartbeatRef.current = setInterval(() => {
      const now = Date.now()
      setState(prev => {
        if (prev.isConnected && now - prev.lastHeartbeat > HEARTBEAT_INTERVAL * 2) {
          console.warn('💔 Heartbeat perdido, reconectando...')
          return { ...prev, isConnected: false, error: 'Heartbeat perdido' }
        }
        return { ...prev, lastHeartbeat: now }
      })
    }, HEARTBEAT_INTERVAL)
  }, [])

  // 🔌 Conectar a Realtime con timeout y retry logic
  const connect = useCallback(async () => {
    if (!shouldConnectRef.current || state.isConnecting || state.isConnected) return
    
    console.log('📡 Iniciando conexión Smart Realtime...')
    setState(prev => ({ 
      ...prev, 
      isConnecting: true, 
      error: null,
      connectionAttempts: prev.connectionAttempts + 1
    }))

    // Timeout para conexión
    connectionTimeoutRef.current = setTimeout(() => {
      console.warn('⏰ Timeout de conexión Realtime, usando fallback')
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: 'Timeout de conexión' 
      }))
      fallbackToPolling()
    }, CONNECTION_TIMEOUT)

    try {
      const client = createRealtimeClient()
      if (!client) throw new Error('No se pudo crear cliente Realtime')

      // 🔗 Crear canal específico para este usuario
      const channelName = `orders-updates-${userId}`
      const channel = client.channel(channelName)

      // 📡 Suscribirse a cambios en la tabla orders
      channel
        .on('postgres_changes', {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${userId}` // Solo pedidos de este usuario
        }, (payload) => {
          console.log('📨 Realtime update recibido:', payload.eventType, payload.new?.order_number)
          
          // Actualizar heartbeat
          setState(prev => ({ ...prev, lastHeartbeat: Date.now() }))
          
          // Procesar actualización
          if (payload.new) {
            onOrderUpdate(payload.new as Partial<CompleteOrder>)
          }
        })
        .subscribe((status) => {
          console.log('📡 Estado de suscripción Realtime:', status)
          
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current)
            connectionTimeoutRef.current = null
          }
          
          if (status === 'SUBSCRIBED') {
            setState(prev => ({ 
              ...prev, 
              isConnected: true, 
              isConnecting: false,
              error: null,
              lastHeartbeat: Date.now()
            }))
            startHeartbeat()
            console.log('✅ Smart Realtime conectado exitosamente')
            
          } else if (status === 'CLOSED' || status === 'TIMED_OUT') {
            setState(prev => ({ 
              ...prev, 
              isConnected: false, 
              isConnecting: false,
              error: `Conexión ${status.toLowerCase()}`
            }))
            
            // Solo reconectar si aún necesitamos la conexión
            if (shouldConnectRef.current && prev.connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
              console.log(`🔄 Reintentando conexión (${prev.connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)
              setTimeout(connect, 2000 * prev.connectionAttempts) // Backoff exponencial
            } else {
              console.log('🔄 Máx reintentos alcanzados, usando polling fallback')
              fallbackToPolling()
            }
          }
        })

      channelRef.current = channel

    } catch (error) {
      console.error('❌ Error conectando Realtime:', error)
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      }))
      
      if (state.connectionAttempts < MAX_RECONNECT_ATTEMPTS) {
        setTimeout(connect, 5000) // Reintentar en 5s
      } else {
        fallbackToPolling()
      }
    }
  }, [userId, onOrderUpdate, state.isConnecting, state.isConnected, state.connectionAttempts, fallbackToPolling, createRealtimeClient, startHeartbeat])

  // 🔌 Desconectar limpiamente
  const disconnect = useCallback(() => {
    console.log('📡 Desconectando Smart Realtime...')
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }
    
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
    
    if (clientRef.current) {
      clientRef.current.removeAllChannels()
      clientRef.current = null
    }
    
    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
      connectionAttempts: 0,
      lastHeartbeat: 0
    })
  }, [])

  // 🎛️ Efecto principal para manejar conexión/desconexión
  useEffect(() => {
    if (shouldConnect && !state.isConnected && !state.isConnecting) {
      connect()
    } else if (!shouldConnect && (state.isConnected || state.isConnecting)) {
      disconnect()
    }
  }, [shouldConnect, state.isConnected, state.isConnecting, connect, disconnect])

  // 🧹 Cleanup al desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    connectionAttempts: state.connectionAttempts,
    connect,
    disconnect
  }
}