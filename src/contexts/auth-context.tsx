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

    // 🚫 LISTENERS DESHABILITADOS - Volver a estrategia estable
    // Los auth listeners causan problemas al cambiar pestañas
    // Usando Nuclear Client V2.0 para todas las operaciones críticas
    console.log('🔧 AuthProvider: Listeners deshabilitados para estabilidad')
    
    const subscription = null // ✅ No listeners problemáticos

    // 🚫 VISIBILITY LISTENER DESHABILITADO - Causa problemas de corrupción
    // El Nuclear Client V2.0 maneja la recuperación automática de token
    console.log('🔧 AuthProvider: Visibility listener deshabilitado para estabilidad')

    return () => {
      // ✅ Cleanup simplificado - no hay listeners activos
      console.log('🧹 AuthProvider: Cleanup completado')
      // No hay listeners que limpiar
      
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
      console.log('👤 Cargando perfil para usuario:', authUser.id, authUser.email)
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      console.log('📋 Perfil del usuario:', { profile, error: profileError })

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

      console.log('✅ Usuario completo configurado:', completeUser)
      setUser(completeUser)
    } catch (error) {
      console.error('❌ Error loading user profile:', error)
      
      // Fallback: usar solo datos de auth si no hay perfil
      const fallbackUser: CompleteUser = {
        auth_user: authUser,
        profile: null,
        role: null,
        bodegon_assignments: []
      }
      
      console.log('🔄 Usando usuario fallback:', fallbackUser)
      setUser(fallbackUser)
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