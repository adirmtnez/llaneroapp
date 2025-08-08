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

  // ❌ LISTENERS COMPLETAMENTE DESHABILITADOS - Multiple GoTrueClient instances issue
  // CAUSA: Múltiples clientes Supabase están causando conflictos de estado
  useEffect(() => {
    console.log('SupabaseProvider: Auth listeners DESHABILITADOS para prevenir conflictos')
    
    // NO crear subscription para evitar múltiples listeners
    // La aplicación funcionará solo con tokens directos del localStorage
    
    return () => {
      console.log('SupabaseProvider: Cleanup - no subscription to unsubscribe')
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

