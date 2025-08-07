import { supabase } from '@/lib/supabase'
import { 
  BodegonCategory, 
  BodegonCategoryInsert, 
  BodegonCategoryUpdate, 
  BodegonCategoryWithSubcategories 
} from '@/types/bodegons'

export class BodegonCategoryService {
  // Get all categories with optional filters
  static async getAll(filters?: {
    is_active?: boolean
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: BodegonCategoryWithSubcategories[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('bodegon_categories')
        .select(`
          *,
          subcategories:bodegon_subcategories(count),
          product_count:bodegon_products(count)
        `)

      // Apply filters
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
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

      // Transform the data
      const transformedData = data?.map(item => ({
        ...item,
        subcategories: Array.isArray(item.subcategories) ? item.subcategories : [],
        product_count: Array.isArray(item.product_count) ? item.product_count.length : 0
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get category by ID with subcategories
  static async getById(id: string): Promise<{ data: BodegonCategoryWithSubcategories | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_categories')
        .select(`
          *,
          subcategories:bodegon_subcategories(*),
          product_count:bodegon_products(count)
        `)
        .eq('id', id)
        .single()

      if (error) {
        return { data: null, error }
      }

      // Transform the data
      const transformedData = {
        ...data,
        subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
        product_count: Array.isArray(data.product_count) ? data.product_count.length : 0
      }

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new category
  static async create(data: BodegonCategoryInsert, userId?: string): Promise<{ data: BodegonCategory | null; error: Error | null }> {
    try {
      const insertData: BodegonCategoryInsert = {
        ...data,
        created_by: userId,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_categories')
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

  // Update category
  static async update(id: string, data: BodegonCategoryUpdate, userId?: string): Promise<{ data: BodegonCategory | null; error: Error | null }> {
    try {
      const updateData: BodegonCategoryUpdate = {
        ...data,
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_categories')
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

  // Delete category (soft delete)
  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_categories')
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

  // Hard delete category
  static async hardDelete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_categories')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Toggle active status
  static async toggleActive(id: string): Promise<{ data: BodegonCategory | null; error: Error | null }> {
    try {
      // First get current status
      const { data: current, error: getCurrentError } = await supabase
        .from('bodegon_categories')
        .select('is_active')
        .eq('id', id)
        .single()

      if (getCurrentError) {
        return { data: null, error: getCurrentError }
      }

      // Toggle the status
      const { data: result, error } = await supabase
        .from('bodegon_categories')
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

  // Get categories with product count
  static async getCategoriesWithStats(): Promise<{ data: BodegonCategoryWithSubcategories[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_categories')
        .select(`
          *,
          subcategories:bodegon_subcategories(id),
          products:bodegon_products(id)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      // Transform the data to include counts
      const transformedData = data?.map(item => ({
        ...item,
        subcategories: Array.isArray(item.subcategories) ? item.subcategories : [],
        product_count: Array.isArray(item.products) ? item.products.length : 0
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}