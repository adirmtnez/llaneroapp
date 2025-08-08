"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthContextType, CompleteUser, AuthCredentials, RegisterData, UserProfileUpdate } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CompleteUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user)
      } else {
        setLoading(false)
      }
    })

    // ✅ LISTENERS INTELIGENTES - Reactivar con filtrado inteligente
    console.log('🔧 AuthProvider: Inicializando auth listeners en producción')
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🎯 AuthProvider: Auth state changed:', event, 'Session exists:', !!session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          // 🧠 LÓGICA INTELIGENTE: Solo procesar SIGNED_OUT legítimos
          const localToken = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
          
          // Si NO hay token en localStorage, es logout intencional - procesar siempre
          if (!localToken) {
            console.log('AuthProvider: ✅ Procesando SIGNED_OUT legítimo - no hay token localStorage')
            setUser(null)
            setLoading(false)
            return
          }
          
          // Si hay token, verificar si es válido para detectar falsos SIGNED_OUT
          try {
            const parsed = JSON.parse(localToken)
            const expiresAt = parsed?.expires_at * 1000
            const isTokenValid = Date.now() < expiresAt
            
            if (isTokenValid && session === null) {
              console.log('AuthProvider: 🚫 Ignorando SIGNED_OUT falso - token localStorage válido')
              return // NO resetear usuario en eventos falsos
            }
          } catch (e) {
            console.log('Error verificando token localStorage:', e)
          }
          
          console.log('AuthProvider: ✅ Procesando SIGNED_OUT legítimo')
          setUser(null)
          setLoading(false)
        }
      }
    )

    // ✅ REACTIVADO - Handle page visibility changes con smart recovery
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('🔍 Page became visible, checking session intelligently...')
        
        try {
          // 🧠 LÓGICA INTELIGENTE: Solo recuperar sesión si no hay usuario actual o está corrupto
          if (user && !loading) {
            console.log('✅ Usuario ya cargado y válido, saltando verificación')
            return
          }
          
          // Verificar localStorage primero
          const localToken = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
          if (!localToken) {
            console.log('🚫 No hay token localStorage, usuario no logueado')
            setUser(null)
            setLoading(false)
            return
          }
          
          // Verificar si token es válido
          try {
            const parsed = JSON.parse(localToken)
            const expiresAt = parsed?.expires_at * 1000
            const isTokenValid = Date.now() < expiresAt
            
            if (!isTokenValid) {
              console.log('⏰ Token localStorage expirado, limpiando')
              localStorage.removeItem('sb-zykwuzuukrmgztpgnbth-auth-token')
              setUser(null)
              setLoading(false)
              return
            }
          } catch {
            console.log('❌ Token localStorage corrupto, limpiando')
            localStorage.removeItem('sb-zykwuzuukrmgztpgnbth-auth-token')
            setUser(null)
            setLoading(false)
            return
          }
          
          // Solo aquí hacer verificación de sesión Supabase
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Error getting session:', error)
            // No resetear usuario inmediatamente, podría ser error temporal
            console.log('⚠️  Error temporal de sesión, manteniendo estado actual')
            return
          }
          
          if (session?.user && !user) {
             console.log('🔄 Sesión válida encontrada, cargando perfil de usuario...')
             await loadUserProfile(session.user)
             
             // Dispatch event para que otros componentes se enteren
             setTimeout(() => {
               console.log('📡 Dispatching authRestored event')
               window.dispatchEvent(new CustomEvent('authRestored'))
             }, 200)
           } else if (!session?.user && user) {
             console.log('🚪 No hay sesión válida pero hay usuario local, verificando...')
             // Podría ser desconexión temporal, no resetear inmediatamente
             console.log('⏳ Esperando para confirmar desconexión...')
           }
        } catch (error) {
          console.error('Error refreshing session on visibility change:', error)
          // NO resetear usuario en errores, podría ser temporal
          console.log('⚠️  Error en visibility handler, manteniendo estado actual')
        }
      }
    }

    // ✅ LISTENER ACTIVO - Recovery inteligente al cambiar pestañas
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      // ✅ Cleanup completo para prevenir procesos colgantes
      console.log('🧹 AuthProvider: Limpiando listeners y estados')
      
      if (subscription) {
        subscription.unsubscribe()
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Reset estados para evitar memory leaks
      setLoading(false)
      
      // Limpiar cualquier timeout pendiente del visibility handler
      if (typeof window !== 'undefined') {
        // Dispatch evento de cleanup si es necesario
        try {
          window.dispatchEvent(new CustomEvent('authCleanup'))
        } catch (error) {
          console.error('Error dispatching cleanup event:', error)
        }
      }
    }
  }, [])

  const loadUserProfile = async (authUser: SupabaseUser) => {
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // Get user role if profile exists
      let role = null
      if (profile?.role) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('*')
          .eq('id', profile.role)
          .single()
        role = roleData
      }

      // Get bodegon assignments
      const { data: assignments } = await supabase
        .from('user_bodegon_assignments')
        .select('*')
        .eq('user_id', authUser.id)

      const completeUser: CompleteUser = {
        auth_user: authUser,
        profile: profile || null,
        role: role,
        bodegon_assignments: assignments || []
      }

      setUser(completeUser)
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (credentials: AuthCredentials): Promise<{ error: Error | null }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      
      if (error) {
        return { error }
      }
      
      // ✅ FORZAR carga del perfil después del login exitoso
      // Esto es necesario porque los listeners están deshabilitados
      if (data.user) {
        await loadUserProfile(data.user)
      }
      
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (data: RegisterData): Promise<{ error: Error | null }> => {
    try {
      // Step 1: Create auth user with display name
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.name,
            display_name: data.name
          }
        }
      })

      if (authError) {
        return { error: authError }
      }

      if (authData.user) {
        // Step 2: Create user profile entry
        try {
          // Use the session token from signup response if available
          if (authData.session?.access_token) {
            // Create fresh client for profile creation with nuclear solution
            const { createClient } = await import('@supabase/supabase-js')
            const nuclearClient = createClient(
              'https://zykwuzuukrmgztpgnbth.supabase.co',
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
              {
                auth: { persistSession: false },
                global: {
                  headers: {
                    Authorization: `Bearer ${authData.session.access_token}`,
                    'Content-Type': 'application/json'
                  }
                }
              }
            )

            // Insert user profile with Customer role (4)
            const { error: profileError } = await nuclearClient
              .from('users')
              .insert({
                id: authData.user.id,
                name: data.name,
                email: data.email,
                role: 4, // Customer role
                created_at: new Date().toISOString()
              })

            if (profileError) {
              console.error('Error creating user profile with nuclear solution:', profileError)
              throw profileError
            }
          } else {
            throw new Error('No session token available')
          }

        } catch (nuclearError) {
          console.error('Nuclear solution error, using fallback:', nuclearError)
          // Fallback to regular supabase client
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name: data.name,
              email: data.email,
              role: 4, // Customer role
              created_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('Error creating user profile with fallback:', profileError)
            return { error: profileError }
          }
        }

        // Step 3: Update auth user display name
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: data.name,
            display_name: data.name
          }
        })

        if (updateError) {
          console.error('Error updating display name:', updateError)
          // Don't return error here as profile was created successfully
        }
      }

      return { error: null }
    } catch (error) {
      console.error('SignUp error:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    // ✅ CRÍTICO: Limpiar token ANTES de llamar a signOut
    // Esto previene que smart listeners ignoren el SIGNED_OUT legítimo
    try {
      localStorage.removeItem('adminCurrentView')
      localStorage.removeItem('sb-zykwuzuukrmgztpgnbth-auth-token') // ✅ Limpiar ANTES
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
    
    // Limpiar estado del contexto inmediatamente
    setUser(null)
    setLoading(false)
    
    try {
      // Intentar logout de Supabase (puede disparar evento SIGNED_OUT)
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out from Supabase:', error)
        // NO hacer throw - ya limpiamos el estado local
      }
    } catch (error) {
      console.error('Unexpected error during signOut:', error)
      // Estado ya limpiado arriba
    }
  }

  const updateProfile = async (updates: UserProfileUpdate): Promise<{ error: Error | null }> => {
    try {
      if (!user) {
        return { error: new Error('No user found') }
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.auth_user.id)

      if (error) {
        return { error }
      }

      await loadUserProfile(user.auth_user)
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const canAccessAdmin = (): boolean => {
    if (!user?.profile?.role) {
      return false
    }
    return user.profile.role === 1 || user.profile.role === 2
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    canAccessAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}