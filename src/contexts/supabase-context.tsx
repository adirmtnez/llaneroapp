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

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('SupabaseProvider: Auth state changed:', event)
        
        if (event === 'SIGNED_IN' && session) {
          setSession(session)
          setSessionState('valid')
        } else if (event === 'SIGNED_OUT') {
          setSession(null)
          setSessionState('invalid')
        } else if (event === 'TOKEN_REFRESHED' && session) {
          console.log('SupabaseProvider: Token refreshed')
          setSession(session)
          setSessionState('valid')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
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

// Hook for safe database operations
export function useSupabaseQuery() {
  const { client, sessionState, isReady } = useSupabase()
  
  const executeQuery = async <T>(
    queryFn: (client: SupabaseClient) => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: Error | null }> => {
    // Wait for session to be ready
    if (!isReady) {
      return { data: null, error: new Error('Session not ready') }
    }
    
    // Only execute if session is valid
    if (sessionState !== 'valid') {
      return { data: null, error: new Error('Invalid session') }
    }
    
    try {
      const result = await queryFn(client)
      return {
        data: result.data,
        error: result.error ? new Error(result.error.message) : null
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }
  
  return {
    executeQuery,
    isReady,
    sessionValid: sessionState === 'valid',
    sessionState
  }
}