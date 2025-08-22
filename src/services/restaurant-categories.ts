import { 
  RestaurantCategory, 
  RestaurantSubcategory 
} from '@/types/restaurants'

export interface RestaurantCategoryWithDetails extends RestaurantCategory {
  product_count?: number
  subcategories?: RestaurantSubcategory[]
}

export interface RestaurantCategoryInsert {
  name: string
  restaurant_id?: string
  is_active: boolean
  created_by?: string
  created_at?: string
  image?: string
}

export interface RestaurantCategoryUpdate {
  name?: string
  restaurant_id?: string
  is_active?: boolean
  image?: string
}

export class RestaurantCategoryService {
  // Get all categories with optional filters
  static async getAll(filters?: {
    is_active?: boolean
    search?: string
    limit?: number
    offset?: number
    restaurant_id?: string
  }): Promise<{ data: RestaurantCategoryWithDetails[] | null; error: Error | null }> {
    try {
      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          let query = client
            .from('restaurant_categories')
            .select(`
              *,
              subcategories:restaurant_subcategories!parent_category(count)
            `)

          // Apply filters
          if (filters?.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`)
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

      // Transform the data and manually count products for each category
      const transformedData = await Promise.all(data?.map(async (item) => {
        // Manual count of products for this specific category
        const { data: productCount, error: countError } = await executeNuclearQuery(
          async (client) => {
            return await client
              .from('restaurant_products')
              .select('id', { count: 'exact', head: true })
              .eq('category_id', item.id)
          },
          false
        )

        return {
          ...item,
          subcategories: Array.isArray(item.subcategories) ? item.subcategories : [],
          product_count: countError ? 0 : (productCount || 0)
        }
      }) || [])

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get category by ID with subcategories
  static async getById(id: string): Promise<{ data: RestaurantCategoryWithDetails | null; error: Error | null }> {
    try {
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          const { data, error } = await client
            .from('restaurant_categories')
            .select(`
              *,
              subcategories:restaurant_subcategories!parent_category(*)
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

      // Manual count of products for this specific category
      const { data: productCount, error: countError } = await executeNuclearQuery(
        async (client) => {
          return await client
            .from('restaurant_products')
            .select('id', { count: 'exact', head: true })
            .eq('category_id', id)
        },
        false
      )

      // Transform the data
      const transformedData = {
        ...data,
        subcategories: Array.isArray(data?.subcategories) ? data.subcategories : [],
        product_count: countError ? 0 : (productCount || 0)
      }

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new category
  static async create(category: RestaurantCategoryInsert): Promise<{ data: RestaurantCategory | null; error: Error | null }> {
    try {
      const { nuclearInsert } = await import('@/utils/nuclear-client')
      
      const { data, error } = await nuclearInsert(
        'restaurant_categories',
        category,
        '*'
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      return { data: data as RestaurantCategory, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Update existing category
  static async update(id: string, updates: RestaurantCategoryUpdate): Promise<{ data: RestaurantCategory | null; error: Error | null }> {
    try {
      const { nuclearUpdate } = await import('@/utils/nuclear-client')
      
      const { data, error } = await nuclearUpdate(
        'restaurant_categories',
        id,
        updates,
        '*'
      )

      if (error) {
        return { data: null, error: new Error(error) }
      }

      return { data: data as RestaurantCategory, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Delete category
  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { nuclearDelete } = await import('@/utils/nuclear-client')
      
      const { error } = await nuclearDelete('restaurant_categories', id)
      
      if (error) {
        return { error: new Error(error) }
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Get categories count
  static async getCount(filters?: {
    is_active?: boolean
    search?: string
    restaurant_id?: string
  }): Promise<{ data: number; error: Error | null }> {
    try {
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          let query = client
            .from('restaurant_categories')
            .select('*', { count: 'exact', head: true })

          // Apply filters
          if (filters?.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
          }

          if (filters?.search) {
            query = query.ilike('name', `%${filters.search}%`)
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
}