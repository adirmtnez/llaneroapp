import { supabase } from '@/lib/supabase'
import { 
  BodegonSubcategory, 
  BodegonSubcategoryInsert, 
  BodegonSubcategoryUpdate 
} from '@/types/bodegons'

export type BodegonSubcategoryWithDetails = BodegonSubcategory & {
  category?: {
    id: string
    name: string
  }
  product_count?: number
}

export class BodegonSubcategoryService {
  // Get all subcategories with optional filters
  static async getAll(filters?: {
    is_active?: boolean
    parent_category?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ data: BodegonSubcategoryWithDetails[] | null; error: Error | null }> {
    try {
      let query = supabase
        .from('bodegon_subcategories')
        .select(`
          *,
          category:bodegon_categories(id, name),
          product_count:bodegon_products(count)
        `)

      // Apply filters
      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }

      if (filters?.parent_category) {
        query = query.eq('parent_category', filters.parent_category)
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
        product_count: Array.isArray(item.product_count) ? item.product_count.length : 0
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get subcategory by ID
  static async getById(id: string): Promise<{ data: BodegonSubcategoryWithDetails | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_subcategories')
        .select(`
          *,
          category:bodegon_categories(id, name),
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
        product_count: Array.isArray(data.product_count) ? data.product_count.length : 0
      }

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Get subcategories by category ID
  static async getByCategory(categoryId: string): Promise<{ data: BodegonSubcategoryWithDetails[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('bodegon_subcategories')
        .select(`
          *,
          category:bodegon_categories(id, name),
          product_count:bodegon_products(count)
        `)
        .eq('parent_category', categoryId)
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      // Transform the data
      const transformedData = data?.map(item => ({
        ...item,
        product_count: Array.isArray(item.product_count) ? item.product_count.length : 0
      })) || []

      return { data: transformedData, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  // Create new subcategory
  static async create(data: BodegonSubcategoryInsert, userId?: string): Promise<{ data: BodegonSubcategory | null; error: Error | null }> {
    try {
      const insertData: BodegonSubcategoryInsert = {
        ...data,
        created_by: userId,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_subcategories')
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

  // Update subcategory
  static async update(id: string, data: BodegonSubcategoryUpdate, userId?: string): Promise<{ data: BodegonSubcategory | null; error: Error | null }> {
    try {
      const updateData: BodegonSubcategoryUpdate = {
        ...data,
        modified_date: new Date().toISOString(),
      }

      const { data: result, error } = await supabase
        .from('bodegon_subcategories')
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

  // Delete subcategory (soft delete)
  static async delete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_subcategories')
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

  // Hard delete subcategory
  static async hardDelete(id: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase
        .from('bodegon_subcategories')
        .delete()
        .eq('id', id)

      return { error }
    } catch (error) {
      return { error: error as Error }
    }
  }

  // Toggle active status
  static async toggleActive(id: string): Promise<{ data: BodegonSubcategory | null; error: Error | null }> {
    try {
      // First get current status
      const { data: current, error: getCurrentError } = await supabase
        .from('bodegon_subcategories')
        .select('is_active')
        .eq('id', id)
        .single()

      if (getCurrentError) {
        return { data: null, error: getCurrentError }
      }

      // Toggle the status
      const { data: result, error } = await supabase
        .from('bodegon_subcategories')
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