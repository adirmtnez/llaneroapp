"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { SupabaseClient, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from './auth-context'

type SessionState = 'loading' | 'valid' | 'invalid' | 'refreshing'

interface SupabaseContextType {
  client: SupabaseClient
  sessionState: SessionState
  session: Session | null
  isReady: boolean
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>('loading')
  const [session, setSession] = useState<Session | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { user, loading: authLoading } = useAuth()

  // Function to validate and refresh session if needed
  const validateSession = async (): Promise<Session | null> => {
    try {
      console.log('SupabaseProvider: Validating session...')
      
      // Get current session
      const { data: { session: currentSession }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('SupabaseProvider: Error getting session:', error)
        setSessionState('invalid')
        return null
      }
      
      if (!currentSession) {
        console.log('SupabaseProvider: No session found')
        setSessionState('invalid')
        return null
      }
      
      // Check if token is expired or about to expire (within 5 minutes)
      const now = Math.floor(Date.now() / 1000)
      const expiresAt = currentSession.expires_at || 0
      const timeUntilExpiry = expiresAt - now
      
      if (timeUntilExpiry <= 300) { // 5 minutes
        console.log('SupabaseProvider: Token expires soon, refreshing...')
        setIsRefreshing(true)
        setSessionState('refreshing')
        
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        
        setIsRefreshing(false)
        
        if (refreshError || !refreshedSession) {
          console.error('SupabaseProvider: Error refreshing session:', refreshError)
          setSessionState('invalid')
          return null
        }
        
        console.log('SupabaseProvider: Session refreshed successfully')
        setSession(refreshedSession)
        setSessionState('valid')
        return refreshedSession
      }
      
      console.log('SupabaseProvider: Session is valid')
      setSession(currentSession)
      setSessionState('valid')
      return currentSession
      
    } catch (error) {
      console.error('SupabaseProvider: Unexpected error validating session:', error)
      setSessionState('invalid')
      setIsRefreshing(false)
      return null
    }
  }

  // Initial session validation when auth is ready
  useEffect(() => {
    if (authLoading) return
    
    if (user) {
      validateSession()
    } else {
      setSessionState('invalid')
      setSession(null)
    }
  }, [user, authLoading])

  // ✅ LISTENERS INTELIGENTES - Filtrar eventos falsos pero mantener reactividad
  useEffect(() => {
    console.log('🔧 SupabaseProvider: Inicializando auth listeners en producción')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🎯 SupabaseProvider: Auth state changed:', event, 'Session exists:', !!session)
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session)
          setSessionState('valid')
        } else if (event === 'SIGNED_OUT') {
          // 🧠 LÓGICA INTELIGENTE: Verificar si es un SIGNED_OUT falso
          const localToken = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
          
          // Si NO hay token en localStorage, es logout intencional - procesar siempre
          if (!localToken) {
            console.log('SupabaseProvider: ✅ Procesando SIGNED_OUT legítimo - no hay token localStorage')
            setSession(null)
            setSessionState('invalid')
            return
          }
          
          // Si hay token, verificar si es válido para detectar falsos SIGNED_OUT
          try {
            const parsed = JSON.parse(localToken)
            const expiresAt = parsed?.expires_at * 1000
            const isTokenValid = Date.now() < expiresAt
            
            if (isTokenValid && session === null) {
              console.log('SupabaseProvider: 🚫 Ignorando SIGNED_OUT falso - token localStorage válido')
              return // NO procesar evento falso
            }
          } catch (e) {
            console.log('Error verificando token localStorage:', e)
          }
          
          console.log('SupabaseProvider: ✅ Procesando SIGNED_OUT legítimo')
          setSession(null)
          setSessionState('invalid')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('SupabaseProvider: Token refreshed')
          setSession(session)
          setSessionState('valid')
        }
      }
    )

    return () => {
      console.log('🧹 SupabaseProvider: Limpiando auth listener')
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  // Handle page visibility changes
  // ❌ TEMPORALMENTE DESACTIVADO - Page visibility validation
  // CAUSA: Este handler está disparando múltiples recargas de datos
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // ⚠️ DESACTIVADO TEMPORALMENTE PARA TESTING
      console.log('SupabaseProvider: Page visibility changed, but handler is disabled for testing')
      return
      
      if (!document.hidden && user && !isRefreshing) {
        console.log('SupabaseProvider: Page became visible, validating session...')
        await validateSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, isRefreshing])

  const isReady = !authLoading && sessionState !== 'loading'

  const value: SupabaseContextType = {
    client: supabase,
    sessionState,
    session,
    isReady
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

