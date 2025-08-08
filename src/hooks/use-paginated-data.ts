"use client"

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

export interface PaginationConfig {
  initialPageSize?: number
  debounceMs?: number
}

export interface FilterConfig {
  [key: string]: any
}

export interface SortConfig {
  column: string
  direction: 'asc' | 'desc'
}

export interface QueryBuilder<T> {
  (params: {
    currentPage: number
    pageSize: number
    searchTerm: string
    filters: FilterConfig
    sortBy?: SortConfig
  }): Promise<{
    data: T[]
    totalCount: number
  }>
}

export interface UsePaginatedDataResult<T> {
  // Data
  data: T[]
  totalCount: number
  
  // Loading states
  isLoading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  pageSize: number
  searchTerm: string
  debouncedSearchTerm: string
  
  // Filters & Sorting
  filters: FilterConfig
  sortBy?: SortConfig
  
  // Actions
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  setFilters: (filters: FilterConfig) => void
  setSortBy: (sort: SortConfig) => void
  refetch: () => void
  
  // Utils
  totalPages: number
}

export function usePaginatedData<T = any>(
  queryBuilder: QueryBuilder<T>,
  config: PaginationConfig = {}
): UsePaginatedDataResult<T> {
  const { initialPageSize = 10, debounceMs = 500 } = config
  
  // State
  const [data, setData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  
  // Filters & Sorting
  const [filters, setFilters] = useState<FilterConfig>({})
  const [sortBy, setSortBy] = useState<SortConfig>()
  
  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])
  
  // Load data function
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await queryBuilder({
        currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm,
        filters,
        sortBy
      })
      
      setData(result.data)
      setTotalCount(result.totalCount)
      
    } catch (err) {
      const errorMessage = err instanceof Error && err.message === 'Request timeout' 
        ? 'La consulta tardó demasiado tiempo. Intenta de nuevo.'
        : 'Error inesperado al cargar datos'
      
      setError(errorMessage)
      toast.error(errorMessage)
      setData([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [queryBuilder, currentPage, pageSize, debouncedSearchTerm, filters, sortBy])
  
  // Load data when dependencies change
  useEffect(() => {
    loadData()
  }, [loadData])
  
  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filters, sortBy])
  
  // Handle page size change
  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }, [])
  
  // Handle filters change
  const handleFiltersChange = useCallback((newFilters: FilterConfig) => {
    setFilters(newFilters)
  }, [])
  
  const totalPages = Math.ceil(totalCount / pageSize)
  
  return {
    // Data
    data,
    totalCount,
    
    // Loading states
    isLoading,
    error,
    
    // Pagination
    currentPage,
    pageSize,
    searchTerm,
    debouncedSearchTerm,
    
    // Filters & Sorting
    filters,
    sortBy,
    
    // Actions
    setCurrentPage,
    setPageSize: handlePageSizeChange,
    setSearchTerm,
    setFilters: handleFiltersChange,
    setSortBy,
    refetch: loadData,
    
    // Utils
    totalPages
  }
}