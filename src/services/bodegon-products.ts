import { supabase } from '@/lib/supabase'
import { 
  BodegonProduct, 
  BodegonProductInsert, 
  BodegonProductUpdate, 
  BodegonProductWithDetails 
} from '@/types/bodegons'

export class BodegonProductService {
  // Get all products with optional filters
  static async getAll(filters?: {
    is_active_product?: boolean
    category_id?: string
    subcategory_id?: string
    is_discount?: boolean
    is_promo?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)

      // Apply filters
      if (filters?.is_active_product !== undefined) {
        query = query.eq('is_active_product', filters.is_active_product)
      }

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters?.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id)
      }

      if (filters?.is_discount !== undefined) {
        query = query.eq('is_discount', filters.is_discount)
      }

      if (filters?.is_promo !== undefined) {
        query = query.eq('is_promo', filters.is_promo)
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      // Order by name
      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get product by ID
  static async getById(id: string): Promise<{ data: BodegonProductWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon, bodegons(id, name))
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error }
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get products by category
  static async getByCategory(categoryId: string): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)
        .eq('category_id', categoryId)
        .eq('is_active_product', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get products by subcategory
  static async getBySubcategory(subcategoryId: string): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)
        .eq('subcategory_id', subcategoryId)
        .eq('is_active_product', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new product
  static async create(data: BodegonProductInsert, userId?: string): Promise<{ data: BodegonProduct | null; error: Error | null }> {
    try {
      const insertData: BodegonProductInsert = {
        ...data,
        created_by: userId,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_products')
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

  // Update product
  static async update(id: string, data: BodegonProductUpdate, userId?: string): Promise<{ data: BodegonProduct | null; error: Error | null }> {
    try {
      const updateData: BodegonProductUpdate = {
        ...data,
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_products')
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

  // Delete product (soft delete)
  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_products')
        .update({ 
          is_active_product: false,
          modified_date: new Date().toISOString()
        })
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Hard delete product
  static async hardDelete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_products')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Toggle active status
  static async toggleActive(id: string): Promise<{ data: BodegonProduct | null; error: Error | null }> {
    try {
      // First get current status
      const { data: current, error: getCurrentError } = await supabase
        .from('bodegon_products')
        .select('is_active_product')
        .eq('id', id)
        .single()

      if (getCurrentError) {
        return { data: null, error: getCurrentError }
      }

      // Toggle the status
      const { data: result, error } = await supabase
        .from('bodegon_products')
        .update({ 
          is_active_product: !current.is_active_product,
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

  // Get products with discounts
  static async getDiscounted(): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)
        .eq('is_discount', true)
        .eq('is_active_product', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get promotional products
  static async getPromotional(): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)
        .eq('is_promo', true)
        .eq('is_active_product', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Search products
  static async search(searchTerm: string, filters?: {
    category_id?: string
    is_active_product?: boolean
    limit?: number
  }): Promise<{ data: BodegonProductWithDetails[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('bodegon_products')
        .select(`
          *,
          category:bodegon_categories(id, name),
          subcategory:bodegon_subcategories(id, name),
          inventory:bodegon_inventories(id, bodegon_id, is_available_at_bodegon)
        `)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)

      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      if (filters?.is_active_product !== undefined) {
        query = query.eq('is_active_product', filters.is_active_product)
      }

      if (filters?.limit) {
        query = query.limit(filters.limit)
      }

      query = query.order('name', { ascending: true })

      const { data, error } = await query

      if (error) {
        return { data: null, error }
      }

      return { data: data || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}