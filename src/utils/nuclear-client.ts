// Utilidad para crear clientes Supabase completamente independientes
// que bypassean todos los contextos y problemas de visibilitychange

// Cache del cliente para evitar múltiples instancias
let cachedNuclearClient: any = null
let lastTokenHash: string | null = null

export const createNuclearClient = async () => {
  // 1. Obtener token del localStorage
  let accessToken: string | null = null
  
  try {
    const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
    if (supabaseSession) {
      const parsedSession = JSON.parse(supabaseSession)
      accessToken = parsedSession?.access_token
      
      // Verificar si el token expiró
      const expiresAt = parsedSession?.expires_at * 1000
      const now = Date.now()
      
      if (now > expiresAt) {
        console.error('Nuclear Client: Token expirado')
        cachedNuclearClient = null
        lastTokenHash = null
        return null
      }
      
      // Crear hash simple del token para cache
      const currentTokenHash = accessToken.substring(0, 10) + accessToken.substring(accessToken.length - 10)
      
      // Reutilizar cliente si el token no cambió
      if (cachedNuclearClient && lastTokenHash === currentTokenHash) {
        return cachedNuclearClient
      }
      
      lastTokenHash = currentTokenHash
    }
  } catch (error) {
    console.error('Nuclear Client: Error obteniendo token:', error)
    return null
  }
  
  if (!accessToken) {
    console.error('Nuclear Client: No se encontró token válido')
    return null
  }

  // 2. Crear cliente fresco solo cuando sea necesario
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

  return cachedNuclearClient
}

// Wrapper para operaciones comunes con manejo de errores
export const executeNuclearQuery = async <T>(
  operation: (client: any) => Promise<{ data: T | null, error: any }>
): Promise<{ data: T | null, error: string | null }> => {
  try {
    const client = await createNuclearClient()
    
    if (!client) {
      return {
        data: null,
        error: 'No se pudo crear cliente nuclear - token inválido'
      }
    }

    const result = await operation(client)
    
    if (result.error) {
      console.error('Nuclear Query Error:', result.error)
      return {
        data: null,
        error: result.error.message || 'Error desconocido en la consulta'
      }
    }

    return {
      data: result.data,
      error: null
    }
    
  } catch (error) {
    console.error('Nuclear Client Error:', error)
    return {
      data: null,
      error: 'Error inesperado al ejecutar operación nuclear'
    }
  }
}