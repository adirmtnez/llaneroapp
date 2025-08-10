import { nuclearSelect, nuclearUpdate, publicSelect } from './nuclear-client'

export interface BodegonPreference {
  id: string
  name: string
}

/**
 * Guarda la preferencia de bodegón del usuario
 */
export async function saveBodegonPreference(userId: string, bodegonId: string) {
  try {
    console.log('💾 Guardando preferencia de bodegón:', { userId, bodegonId })
    
    const { data, error } = await nuclearUpdate(
      'users',
      userId,
      { preferred_bodegon: bodegonId },
      'preferred_bodegon'
    )

    if (error) {
      console.error('❌ Error guardando preferencia de bodegón:', error)
      return { success: false, error }
    }

    console.log('✅ Preferencia de bodegón guardada:', data)
    return { success: true, data }
  } catch (error) {
    console.error('💥 Error en saveBodegonPreference:', error)
    return { success: false, error: 'Error guardando preferencia de bodegón' }
  }
}

/**
 * Carga la preferencia de bodegón del usuario con información del bodegón
 */
export async function loadBodegonPreference(userId: string): Promise<BodegonPreference> {
  try {
    console.log('📂 Cargando preferencia de bodegón para usuario:', userId)
    
    // Cargar usuario con información del bodegón preferido
    const { data, error } = await nuclearSelect(
      'users',
      `preferred_bodegon, bodegons!preferred_bodegon(id, name, is_active)`,
      { id: userId }
    )

    if (error) {
      console.error('❌ Error cargando preferencia de bodegón:', error)
      return getDefaultBodegon()
    }

    const user = data?.[0]
    const preferredBodegon = user?.bodegons

    // Si tiene bodegón preferido y está activo, devolverlo
    if (preferredBodegon && preferredBodegon.is_active) {
      console.log('✅ Bodegón preferido encontrado:', preferredBodegon)
      return {
        id: preferredBodegon.id,
        name: preferredBodegon.name
      }
    }

    // Si no tiene preferencia o el bodegón está inactivo, devolver default
    console.log('🔄 Usando bodegón por defecto')
    return getDefaultBodegon()

  } catch (error) {
    console.error('💥 Error en loadBodegonPreference:', error)
    return getDefaultBodegon()
  }
}

/**
 * Obtiene el bodegón por defecto (el primero activo)
 */
async function getDefaultBodegon(): Promise<BodegonPreference> {
  try {
    const { data } = await publicSelect(
      'bodegons',
      'id, name',
      { is_active: true }
    )

    if (data && data.length > 0) {
      return {
        id: data[0].id,
        name: data[0].name
      }
    }

    // Fallback si no hay bodegones activos
    return {
      id: '',
      name: 'La Estrella'
    }
  } catch (error) {
    console.error('Error obteniendo bodegón por defecto:', error)
    return {
      id: '',
      name: 'La Estrella'
    }
  }
}

/**
 * Obtiene todos los bodegones activos para el selector
 */
export async function getActiveBodegones() {
  try {
    const { data, error } = await publicSelect(
      'bodegons',
      'id, name, address, phone',
      { is_active: true }
    )

    if (error) {
      console.error('Error cargando bodegones activos:', error)
      return { bodegones: [], error }
    }

    return { bodegones: data || [], error: null }
  } catch (error) {
    console.error('Error en getActiveBodegones:', error)
    return { bodegones: [], error: 'Error cargando bodegones' }
  }
}