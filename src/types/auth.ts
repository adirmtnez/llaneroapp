import { Database } from './database'
import { User as SupabaseUser } from '@supabase/supabase-js'

// Tipos base de las tablas
export type UserProfile = Database['public']['Tables']['users']['Row']
export type Role = Database['public']['Tables']['roles']['Row']
export type UserBodegonAssignment = Database['public']['Tables']['user_bodegon_assignments']['Row']

// Tipos para inserts
export type UserProfileInsert = Database['public']['Tables']['users']['Insert']
export type UserBodegonAssignmentInsert = Database['public']['Tables']['user_bodegon_assignments']['Insert']

// Tipos para updates
export type UserProfileUpdate = Database['public']['Tables']['users']['Update']
export type UserBodegonAssignmentUpdate = Database['public']['Tables']['user_bodegon_assignments']['Update']

// Tipo completo de usuario con perfil y role
export type CompleteUser = {
  auth_user: SupabaseUser
  profile: UserProfile | null
  role: Role | null
  bodegon_assignments: UserBodegonAssignment[]
}

// Tipos para autenticación
export type AuthCredentials = {
  email: string
  password: string
}

export type RegisterData = {
  name: string
  email: string
  password: string
  phone_number?: string
}

// Tipos para contexto de autenticación
export type AuthContextType = {
  user: CompleteUser | null
  loading: boolean
  signIn: (credentials: AuthCredentials) => Promise<{ error: Error | null }>
  signUp: (data: RegisterData) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfileUpdate>) => Promise<{ error: Error | null }>
  canAccessAdmin: () => boolean
}

// Roles disponibles (ajustar según tu sistema)
export type UserRole = 'admin' | 'manager' | 'operator' | 'customer'

// Permisos por ubicación
export type LocationRole = 'owner' | 'manager' | 'operator' | 'delivery'