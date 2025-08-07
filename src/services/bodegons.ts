import { SupabaseClient } from '@supabase/supabase-js'
import { 
  Bodegon, 
  BodegonInsert, 
  BodegonUpdate, 
  BodegonWithDetails 
} from '@/types/bodegons'

export class BodegonService {
  // Get all bodegones with optional filters
  static async getAll(
    client: SupabaseClient,
    filters?: {
      is_active?: boolean
      search?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ data: BodegonWithDetails[] | null; error: Error | null }> {
    try {
      console.log('BodegonService.getAll called with filters:', filters)
      
      let query = client
        .from('bodegons')
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

      console.log('Executing bodegons query...')
      const { data: bodegones, error } = await query

      if (error) {
        console.error('Error fetching bodegones:', error)
        return { data: null, error }
      }

      if (!bodegones) {
        console.log('No bodegones found, returning empty array')
        return { data: [], error: null }
      }

      console.log('Found', bodegones.length, 'bodegones, fetching product counts...')

      // Get product count for each bodegón using bodegon_inventories
      const transformedData = await Promise.all(
        bodegones.map(async (bodegon) => {
          try {
            const { count, error: countError } = await client
              .from('bodegon_inventories')
              .select('*', { count: 'exact', head: true })
              .eq('bodegon_id', bodegon.id)
              .eq('is_available_at_bodegon', true)

            if (countError) {
              console.error('Error counting products for bodegon:', bodegon.id, countError)
              return { ...bodegon, product_count: 0 }
            }

            return { ...bodegon, product_count: count || 0 }
          } catch (err) {
            console.error('Error in product count for bodegon:', bodegon.id, err)
            return { ...bodegon, product_count: 0 }
          }
        })
      )

      console.log('Transformed data ready:', transformedData.length, 'items')
      return { data: transformedData, error: null }
    } catch (error) {
      console.error('Unexpected error in BodegonService.getAll:', error)
      return { data: null, error: error as Error }
    }
  }

  // Get bodegon by ID
  static async getById(
    client: SupabaseClient,
    id: string
  ): Promise<{ data: BodegonWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await client
        .from('bodegons')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Transform the data
      const transformedData = {
        ...data,
        product_count: 0,
        category_count: 0
      }

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new bodegon
  static async create(
    client: SupabaseClient,
    data: BodegonInsert,
    userId?: string
  ): Promise<{ data: Bodegon | null; error: Error | null }> {
    try {
      const insertData: BodegonInsert = {
        ...data,
        created_by: userId,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await client
        .from('bodegons')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Update bodegon
  static async update(
    client: SupabaseClient,
    id: string,
    data: BodegonUpdate,
    userId?: string
  ): Promise<{ data: Bodegon | null; error: Error | null }> {
    try {
      const updateData: BodegonUpdate = {
        ...data,
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await client
        .from('bodegons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Delete bodegon (soft delete by setting is_active to false)
  static async delete(
    client: SupabaseClient,
    id: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await client
        .from('bodegons')
        .update({ 
          is_active: false,
          modified_date: new Date().toISOString()
        })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Hard delete bodegon (permanent deletion)
  static async hardDelete(
    client: SupabaseClient,
    id: string
  ): Promise<{ error: Error | null }> {
    try {
      // First get the bodegon to check if it has a logo
      const { data: bodegon, error: getError } = await client
        .from('bodegons')
        .select('logo_url')
        .eq('id', id)
        .single()

      if (getError) {
        return { error: getError }
      }

      // Delete all bodegon_inventories related to this bodegon first
      const { error: inventoryDeleteError } = await client
        .from('bodegon_inventories')
        .delete()
        .eq('bodegon_id', id)

      if (inventoryDeleteError) {
        return { error: inventoryDeleteError }
      }

      // Delete logo from storage if exists
      if (bodegon?.logo_url) {
        const { S3StorageService } = await import('./s3-storage')
        await S3StorageService.deleteBodegonLogo(bodegon.logo_url)
      }

      // Delete bodegon record
      const { error } = await client
        .from('bodegons')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Get bodegones assigned to a user
  static async getByUserId(
    client: SupabaseClient,
    userId: string
  ): Promise<{ data: BodegonWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await client
        .from('bodegons')
        .select(`
          *,
          user_bodegon_assignments!inner(role_at_location)
        `)
        .eq('user_bodegon_assignments.user_id', userId)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      // Transform the data
      const transformedData = data?.map(item => ({
        ...item,
        product_count: 0
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Toggle active status
  static async toggleActive(
    client: SupabaseClient,
    id: string
  ): Promise<{ data: Bodegon | null; error: Error | null }> {
    try {
      // First get current status
      const { data: current, error: getCurrentError } = await client
        .from('bodegons')
        .select('is_active')
        .eq('id', id)
        .single()

      if (getCurrentError) {
        return { data: null, error: getCurrentError }
      }

      // Toggle the status
      const { data: result, error } = await client
        .from('bodegons')
        .update({ 
          is_active: !current.is_active,
          modified_date: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data: result, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}