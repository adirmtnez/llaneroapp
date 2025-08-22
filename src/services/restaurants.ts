import { SupabaseClient } from '@supabase/supabase-js'
import { Restaurant } from '@/types/restaurants'

export interface RestaurantWithDetails extends Restaurant {
  product_count?: number
}

export interface RestaurantInsert {
  name: string
  phone_number?: string
  logo_url?: string
  delivery_available: boolean
  pickup_available: boolean
  is_active: boolean
  created_by?: string
}

export interface RestaurantUpdate {
  name?: string
  phone_number?: string
  logo_url?: string
  delivery_available?: boolean
  pickup_available?: boolean
  is_active?: boolean
}

export class RestaurantService {
  // Get all restaurants with optional filters
  static async getAll(
    client: SupabaseClient,
    filters?: {
      is_active?: boolean
      search?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ data: RestaurantWithDetails[] | null; error: Error | null }> {
    try {
      console.log('RestaurantService.getAll called with filters:', filters)
      
      let query = client
        .from('restaurants')
        .select('*')

      // Apply filters
      if (filters?.is_active !== undefined) {
        console.log('Applying is_active filter:', filters.is_active)
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.search) {
        console.log('Applying search filter:', filters.search)
        query = query.ilike('name', `%${filters.search}%`)
      }

      if (filters?.limit) {
        console.log('Applying limit:', filters.limit)
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        console.log('Applying offset:', filters.offset)
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      // Order by name
      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching restaurants:', error)
        return { data: null, error: new Error(error.message) }
      }

      return { data: data as RestaurantWithDetails[], error: null }
    } catch (error) {
      console.error('Unexpected error in RestaurantService.getAll:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  // Get single restaurant by ID
  static async getById(
    client: SupabaseClient,
    id: string
  ): Promise<{ data: RestaurantWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await client
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching restaurant:', error)
        return { data: null, error: new Error(error.message) }
      }

      return { data: data as RestaurantWithDetails, error: null }
    } catch (error) {
      console.error('Unexpected error in RestaurantService.getById:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  // Create new restaurant
  static async create(
    client: SupabaseClient,
    restaurant: RestaurantInsert
  ): Promise<{ data: RestaurantWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await client
        .from('restaurants')
        .insert(restaurant)
        .select()
        .single()

      if (error) {
        console.error('Error creating restaurant:', error)
        return { data: null, error: new Error(error.message) }
      }

      return { data: data as RestaurantWithDetails, error: null }
    } catch (error) {
      console.error('Unexpected error in RestaurantService.create:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  // Update existing restaurant
  static async update(
    client: SupabaseClient,
    id: string,
    updates: RestaurantUpdate
  ): Promise<{ data: RestaurantWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await client
        .from('restaurants')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating restaurant:', error)
        return { data: null, error: new Error(error.message) }
      }

      return { data: data as RestaurantWithDetails, error: null }
    } catch (error) {
      console.error('Unexpected error in RestaurantService.update:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  // Delete restaurant
  static async delete(
    client: SupabaseClient,
    id: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await client
        .from('restaurants')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting restaurant:', error)
        return { error: new Error(error.message) }
      }

      return { error: null }
    } catch (error) {
      console.error('Unexpected error in RestaurantService.delete:', error)
      return { 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  // Get product count for restaurant (placeholder until BD structure verified)
  static async getProductCount(
    client: SupabaseClient,
    restaurantId: string
  ): Promise<{ data: number; error: Error | null }> {
    // TODO: Verificar estructura de BD para productos de restaurantes
    return { data: 0, error: null }
  }
}