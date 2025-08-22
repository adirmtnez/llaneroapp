import { 
  RestaurantSubcategory,
  RestaurantCategory 
} from '@/types/restaurants'

export interface RestaurantSubcategoryWithDetails extends RestaurantSubcategory {
  product_count?: number
  category?: RestaurantCategory
}

export interface RestaurantSubcategoryInsert {
  name: string
  parent_category: string
  restaurant_id?: string | null
  is_active: boolean
  created_by: string
  created_at: string
  modified_at: string
  image?: string
}

export interface RestaurantSubcategoryUpdate {
  name?: string
  parent_category?: string
  is_active?: boolean
  modified_at?: string
  image?: string
}

export class RestaurantSubcategoryService {
  // Get all subcategories with optional filters
  static async getAll(filters?: {
    is_active?: boolean
    search?: string
    limit?: number
    offset?: number
    parent_category?: string
    restaurant_id?: string
  }): Promise<{ data: RestaurantSubcategoryWithDetails[] | null; error: Error | null }> {
    try {
      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          let query = client
            .from('restaurant_subcategories')
            .select(`
              *,
              category:restaurant_categories(*)
            `)

          // Apply filters
          if (filters?.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`)
          }

          if (filters?.parent_category) {
            query = query.eq('parent_category', filters.parent_category)
          }

          if (filters?.restaurant_id) {
            query = query.eq('restaurant_id', filters.restaurant_id)
          }

          if (filters?.limit) {
            query = query.limit(filters.limit)
          }

          if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
          }

          // Order by name
          query = query.order('name', { ascending: true })

          return await query
        },
        false // No mostrar toast automático
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      // Get product count for each subcategory
      const transformedData = await Promise.all(
        (data || []).map(async (subcategory) => {
          const { data: countResult } = await executeNuclearQuery(
            async (client) => {
              const { count } = await client
                .from('restaurant_products')
                .select('*', { count: 'exact', head: true })
                .eq('subcategory_id', subcategory.id)
                .eq('is_active', true)
              
              return { data: count }
            },
            false
          )
          
          return {
            ...subcategory,
            product_count: countResult || 0
          }
        })
      )

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get subcategory by ID
  static async getById(id: string): Promise<{ data: RestaurantSubcategoryWithDetails | null; error: Error | null }> {
    try {
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          const { data, error } = await client
            .from('restaurant_subcategories')
            .select(`
              *,
              category:restaurant_categories(*)
            `)
            .eq('id', id)
            .single()
          
          return { data, error }
        },
        false
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      // Get product count for this subcategory
      const { data: countResult } = await executeNuclearQuery(
        async (client) => {
          const { count } = await client
            .from('restaurant_products')
            .select('*', { count: 'exact', head: true })
            .eq('subcategory_id', data.id)
            .eq('is_active', true)
          
          return { data: count }
        },
        false
      )

      // Transform the data
      const transformedData = {
        ...data,
        product_count: countResult || 0
      }

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new subcategory
  static async create(subcategory: RestaurantSubcategoryInsert): Promise<{ data: RestaurantSubcategory | null; error: Error | null }> {
    try {
      const { nuclearInsert } = await import('@/utils/nuclear-client')
      
      const { data, error } = await nuclearInsert(
        'restaurant_subcategories',
        subcategory,
        '*'
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      return { data: data as RestaurantSubcategory, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Update existing subcategory
  static async update(id: string, updates: RestaurantSubcategoryUpdate): Promise<{ data: RestaurantSubcategory | null; error: Error | null }> {
    try {
      const { nuclearUpdate } = await import('@/utils/nuclear-client')
      
      const { data, error } = await nuclearUpdate(
        'restaurant_subcategories',
        id,
        updates,
        '*'
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      return { data: data as RestaurantSubcategory, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Delete subcategory
  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { nuclearDelete } = await import('@/utils/nuclear-client')
      
      const { error } = await nuclearDelete('restaurant_subcategories', id)
      
      if (error) {
        return { error: new Error(error) }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Get subcategories count
  static async getCount(filters?: {
    is_active?: boolean
    search?: string
    parent_category?: string
    restaurant_id?: string
  }): Promise<{ data: number; error: Error | null }> {
    try {
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          let query = client
            .from('restaurant_subcategories')
            .select('*', { count: 'exact', head: true })

          // Apply filters
          if (filters?.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`)
          }

          if (filters?.parent_category) {
            query = query.eq('parent_category', filters.parent_category)
          }

          if (filters?.restaurant_id) {
            query = query.eq('restaurant_id', filters.restaurant_id)
          }

          return await query
        },
        false
      )

      if (error) {
        return { data: 0, error: new Error(error) }
      }

      return { data: data || 0, error: null }
    } catch (error) {
      return { data: 0, error: error as Error }
    }
  }

  // Get subcategories by category
  static async getByCategory(categoryId: string): Promise<{ data: RestaurantSubcategoryWithDetails[] | null; error: Error | null }> {
    return this.getAll({ parent_category: categoryId, is_active: true })
  }
}