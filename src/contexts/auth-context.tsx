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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
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
      const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })
      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (data: RegisterData): Promise<{ error: Error | null }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        return { error: authError }
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: data.name,
            email: data.email,
          })

        if (profileError) {
          return { error: profileError }
        }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: error as Error }
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