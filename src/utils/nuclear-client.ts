// 🚀 NUCLEAR CLIENT V2.0 - Solución Híbrida Optimizada
// Cliente Supabase completamente independiente que bypasea todos los contextos
// y problemas de cambio de pestañas con auto-recovery y manejo de errores mejorado

import { toast } from 'sonner'

// Cache del cliente para evitar múltiples instancias
let cachedNuclearClient: any = null
let lastTokenHash: string | null = null
let retryCount = 0
const MAX_RETRIES = 3

// ✅ Función para obtener token con validación mejorada
const getValidToken = (): { token: string | null, error: string | null } => {
  try {
    const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
    if (!supabaseSession) {
      return { token: null, error: 'No se encontró sesión en localStorage' }
    }

    const parsedSession = JSON.parse(supabaseSession)
    const accessToken = parsedSession?.access_token
    
    if (!accessToken) {
      return { token: null, error: 'Token no encontrado en sesión' }
    }

    // Verificar expiración con margen de seguridad más conservador (1 minuto)
    const expiresAt = parsedSession?.expires_at
    if (expiresAt) {
      const now = Date.now() / 1000 // Convert to seconds
      const safetyMargin = 60 // 1 minuto en segundos
      
      if (now > (expiresAt - safetyMargin)) {
        // Limpiar token expirado
        localStorage.removeItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        cachedNuclearClient = null
        lastTokenHash = null
        console.warn('🚫 Token expirado, limpiando sesión')
        return { token: null, error: 'Token expirado - por favor inicia sesión nuevamente' }
      }
    }

    return { token: accessToken, error: null }
  } catch (error) {
    return { token: null, error: 'Error al parsear sesión de localStorage' }
  }
}

// ✅ Cliente público para datos que no requieren autenticación
export const createPublicClient = async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    const publicClient = createClient(
      'https://zykwuzuukrmgztpgnbth.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
      {
        auth: { persistSession: false },
        global: {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }
    )

    return { client: publicClient, error: null }
  } catch (error) {
    console.error('💥 Error creando cliente público:', error)
    return { client: null, error: 'Error creando cliente público' }
  }
}

// ✅ Función para consultas públicas (sin auth)
export const publicSelect = async (
  tableName: string, 
  selectFields: string = '*', 
  filters: Record<string, any> = {},
  showUserError: boolean = false,
  customErrorMessage?: string
) => {
  try {
    console.log('🔍 Public Query:', { tableName, selectFields, filters })
    
    const { client, error: clientError } = await createPublicClient()
    if (clientError || !client) {
      if (showUserError) {
        toast.error(customErrorMessage || 'Error de conexión')
      }
      return { data: null, error: clientError }
    }

    // Construir query
    let query = client.from(tableName).select(selectFields)
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query = query.eq(key, value)
      }
    })

    const { data, error } = await query

    if (error) {
      console.error('💥 Error en consulta pública:', error)
      if (showUserError) {
        toast.error(customErrorMessage || 'Error cargando datos')
      }
      return { data: null, error: error.message }
    }

    console.log('✅ Public Query exitosa:', { tableName, count: data?.length || 0 })
    return { data, error: null }
  } catch (error) {
    console.error('💥 Error inesperado en consulta pública:', error)
    if (showUserError) {
      toast.error(customErrorMessage || 'Error inesperado')
    }
    return { data: null, error: 'Error inesperado en consulta' }
  }
}

export const createNuclearClient = async (forceNew = false) => {
  // 1. Obtener y validar token
  const { token: accessToken, error: tokenError } = getValidToken()
  
  if (tokenError || !accessToken) {
    console.error('🚫 Nuclear Client Token Error:', tokenError)
    
    // Si el token está expirado, intentar recargar la página para refrescar la sesión
    if (tokenError === 'Token expirado - por favor inicia sesión nuevamente') {
      console.warn('🔄 Token expirado, recargando página en 2 segundos...')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    }
    
    return null
  }

  // 2. Cache inteligente - reutilizar cliente existente
  const currentTokenHash = accessToken.substring(0, 10) + accessToken.substring(accessToken.length - 10)
  
  if (!forceNew && cachedNuclearClient && lastTokenHash === currentTokenHash) {
    return cachedNuclearClient
  }

  // 3. Crear cliente fresco
  try {
    const { createClient } = await import('@supabase/supabase-js')
    
    cachedNuclearClient = createClient(
      'https://zykwuzuukrmgztpgnbth.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
      {
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      }
    )

    lastTokenHash = currentTokenHash
    retryCount = 0 // Reset contador de reintentos
    return cachedNuclearClient
    
  } catch (error) {
    console.error('🔥 Nuclear Client: Error creando cliente:', error)
    cachedNuclearClient = null
    lastTokenHash = null
    return null
  }
}

// 🚀 Wrapper avanzado con auto-recovery y reintentos
export const executeNuclearQuery = async <T>(
  operation: (client: any) => Promise<{ data: T | null, error: any }>,
  showUserError = true,
  customErrorMessage?: string
): Promise<{ data: T | null, error: string | null }> => {
  
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await createNuclearClient(attempt > 0) // Force new client en reintentos
      
      if (!client) {
        const errorMsg = 'Sesión expirada - por favor inicia sesión nuevamente'
        if (showUserError && attempt === MAX_RETRIES) {
          toast.error(errorMsg)
        }
        return { data: null, error: errorMsg }
      }

      const result = await operation(client)
      
      if (result.error) {
        const errorCode = result.error?.code
        const errorMessage = result.error?.message || 'Error desconocido'
        
        // Detectar errores que ameritan reintentos
        const shouldRetry = (
          errorCode === 'PGRST301' || // JWT expired
          errorCode === 'PGRST302' || // JWT invalid
          errorMessage.includes('JWT') ||
          errorMessage.includes('token') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('network') ||
          errorMessage.includes('timeout')
        )
        
        // Detectar errores de autenticación que requieren limpieza de sesión
        const shouldClearSession = (
          errorCode === 'PGRST301' || // JWT expired
          errorCode === 'PGRST302' || // JWT invalid
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('invalid token') ||
          errorMessage.includes('expired token')
        )
        
        if (shouldRetry && attempt < MAX_RETRIES) {
          console.warn(`🔄 Reintentando operación nuclear (${attempt + 1}/${MAX_RETRIES + 1}):`, errorMessage)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // Backoff exponencial
          continue
        }
        
        // Si es un error de autenticación y ya no se puede reintentar, limpiar sesión
        if (shouldClearSession && attempt === MAX_RETRIES) {
          console.error('🚫 Error de autenticación crítico, limpiando sesión')
          clearCorruptedSession()
          return { data: null, error: 'Sesión expirada' }
        }
        
        console.error('💥 Nuclear Query Error:', result.error)
        try {
          if (result.error && typeof result.error === 'object') {
            console.error('💥 Error Details:', {
              code: result.error?.code || 'No code',
              message: result.error?.message || 'No message',
              details: result.error?.details || 'No details',
              hint: result.error?.hint || 'No hint'
            })
          }
        } catch (logError) {
          console.error('💥 Error logging details:', logError)
        }
        const finalError = customErrorMessage || errorMessage
        
        if (showUserError) {
          toast.error(finalError)
        }
        
        return { data: null, error: finalError }
      }

      // Éxito - resetear contador de reintentos
      retryCount = 0
      return { data: result.data, error: null }
      
    } catch (error) {
      console.error(`💥 Nuclear Client Error (intento ${attempt + 1}):`, error)
      
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      
      const finalError = customErrorMessage || 'Error inesperado en la operación'
      if (showUserError) {
        toast.error(finalError)
      }
      
      return { data: null, error: finalError }
    }
  }
  
  // Esta línea nunca debería ejecutarse, pero TypeScript la requiere
  return { data: null, error: 'Error inesperado' }
}

// 🔧 Función para limpiar sesión corrupta y recargar
export const clearCorruptedSession = () => {
  console.warn('🧹 Limpiando sesión corrupta...')
  
  // Mostrar toast de información al usuario
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast.error('Sesión expirada. Redirigiendo al login...')
  }
  
  // Limpiar localStorage
  try {
    localStorage.removeItem('sb-zykwuzuukrmgztpgnbth-auth-token')
    localStorage.removeItem('supabase.auth.token')
  } catch (error) {
    console.error('Error limpiando localStorage:', error)
  }
  
  // Limpiar cache nuclear
  clearNuclearCache()
  
  // Recargar página después de un breve delay
  setTimeout(() => {
    window.location.href = '/auth'
  }, 1500)
}

// 🛠️ Utilidades específicas para operaciones CRUD comunes
export const nuclearInsert = async <T>(
  tableName: string,
  data: any,
  select?: string
): Promise<{ data: T | null, error: string | null }> => {
  return executeNuclearQuery<T>(async (client) => {
    let query = client.from(tableName).insert(data)
    if (select) {
      query = query.select(select)
    }
    return await query
  }, true, `Error al crear ${tableName}`)
}

export const nuclearUpdate = async <T>(
  tableName: string,
  id: string,
  data: any,
  select?: string
): Promise<{ data: T | null, error: string | null }> => {
  return executeNuclearQuery<T>(async (client) => {
    let query = client.from(tableName).update(data).eq('id', id)
    if (select) {
      query = query.select(select)
    }
    return await query
  }, true, `Error al actualizar ${tableName}`)
}

export const nuclearDelete = async (
  tableName: string,
  id: string
): Promise<{ data: any | null, error: string | null }> => {
  return executeNuclearQuery(async (client) => {
    return await client.from(tableName).delete().eq('id', id)
  }, true, `Error al eliminar ${tableName}`)
}

export const nuclearSelect = async <T>(
  tableName: string,
  select: string = '*',
  filters?: Record<string, any>
): Promise<{ data: T[] | null, error: string | null }> => {
  return executeNuclearQuery<T[]>(async (client) => {
    let query = client.from(tableName).select(select)
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })
    }
    
    return await query
  }, false) // No mostrar errores automáticamente en selects
}

// 🔧 Función para limpiar cache manualmente
export const clearNuclearCache = () => {
  cachedNuclearClient = null
  lastTokenHash = null
  retryCount = 0
  console.log('🧹 Nuclear Client cache limpiado')
}