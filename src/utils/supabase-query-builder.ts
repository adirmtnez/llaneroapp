import { createNuclearClient } from './nuclear-client'

export interface PaginatedQueryParams {
  tableName: string
  select: string
  currentPage: number
  pageSize: number
  searchTerm?: string
  searchColumns?: string[]
  filters?: Record<string, any>
  orderBy?: {
    column: string
    ascending?: boolean
  }
  orFilters?: string[]
}

export interface PaginatedQueryResult<T> {
  data: T[]
  totalCount: number
}

/**
 * Utility function to build paginated Supabase queries with server-side pagination
 * Optimized for performance with separate count and data queries
 */
export async function executePaginatedQuery<T = any>({
  tableName,
  select,
  currentPage,
  pageSize,
  searchTerm,
  searchColumns = [],
  filters = {},
  orderBy = { column: 'created_date', ascending: false },
  orFilters = []
}: PaginatedQueryParams): Promise<PaginatedQueryResult<T>> {
  
  // Get nuclear client
  const client = await createNuclearClient()
  if (!client) {
    throw new Error('No se pudo crear cliente nuclear')
  }

  // 🚀 STEP 1: Build base query with filters (for count)
  let baseQuery = client.from(tableName)

  // Apply basic filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        baseQuery = baseQuery.in(key, value)
      } else {
        baseQuery = baseQuery.eq(key, value)
      }
    }
  })

  // Apply OR filters (like status combinations)
  if (orFilters.length > 0) {
    baseQuery = baseQuery.or(orFilters.join(','))
  }

  // Apply search filters
  if (searchTerm && searchColumns.length > 0) {
    const searchConditions = searchColumns.map(col => `${col}.ilike.%${searchTerm}%`)
    baseQuery = baseQuery.or(searchConditions.join(','))
  }

  // 🚀 STEP 2: Get total count (without joins for better performance)
  const { count, error: countError } = await baseQuery
    .select('*', { count: 'exact', head: true })
  
  if (countError) {
    console.error('Error getting count:', countError)
    throw new Error(`Error al contar registros: ${countError.message}`)
  }

  const totalCount = count || 0

  // 🚀 STEP 3: Get paginated data with joins
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize - 1

  let paginatedQuery = client
    .from(tableName)
    .select(select)

  // Apply the same filters to paginated query
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        paginatedQuery = paginatedQuery.in(key, value)
      } else {
        paginatedQuery = paginatedQuery.eq(key, value)
      }
    }
  })

  // Apply OR filters
  if (orFilters.length > 0) {
    paginatedQuery = paginatedQuery.or(orFilters.join(','))
  }

  // Apply search filters
  if (searchTerm && searchColumns.length > 0) {
    const searchConditions = searchColumns.map(col => `${col}.ilike.%${searchTerm}%`)
    paginatedQuery = paginatedQuery.or(searchConditions.join(','))
  }

  // Apply ordering and pagination
  paginatedQuery = paginatedQuery
    .order(orderBy.column, { ascending: orderBy.ascending })
    .range(startIndex, endIndex)

  const { data, error: dataError } = await paginatedQuery

  if (dataError) {
    throw new Error(`Error al cargar datos: ${dataError.message}`)
  }

  return {
    data: data || [],
    totalCount
  }
}

/**
 * Helper function to build OR filter conditions for status/boolean combinations
 */
export function buildStatusFilters(selectedFilters: string[], fieldMapping: Record<string, string>): string[] {
  const conditions: string[] = []
  
  selectedFilters.forEach(filter => {
    const condition = fieldMapping[filter]
    if (condition) {
      conditions.push(condition)
    }
  })
  
  return conditions
}

/**
 * Example usage for products:
 * 
 * const productQuery = useCallback(async (params) => {
 *   const statusFilters = buildStatusFilters(params.filters.statusFilters || [], {
 *     'Activos': 'is_active_product.eq.true',
 *     'Inactivos': 'is_active_product.eq.false',
 *     'En Descuento': 'is_discount.eq.true',
 *     'En Promoción': 'is_promo.eq.true'
 *   })
 * 
 *   return await executePaginatedQuery({
 *     tableName: 'bodegon_products',
 *     select: `
 *       *,
 *       bodegon_categories!category_id(id, name),
 *       bodegon_subcategories!subcategory_id(id, name)
 *     `,
 *     currentPage: params.currentPage,
 *     pageSize: params.pageSize,
 *     searchTerm: params.searchTerm,
 *     searchColumns: ['name', 'sku', 'bar_code'],
 *     filters: {
 *       category_id: params.filters.selectedCategories,
 *       subcategory_id: params.filters.selectedSubcategories
 *     },
 *     orFilters: statusFilters,
 *     orderBy: { column: 'created_date', ascending: false }
 *   })
 * }, [])
 */