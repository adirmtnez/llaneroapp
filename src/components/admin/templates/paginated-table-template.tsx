import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon } from "lucide-react"
import { useState, useEffect, ReactNode } from "react"

export interface PaginationState {
  currentPage: number
  pageSize: number
  totalCount: number
  searchTerm: string
  debouncedSearchTerm: string
}

export interface PaginationActions {
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  setDebouncedSearchTerm: (term: string) => void
  setTotalCount: (count: number) => void
}

export interface TableColumn<T = any> {
  key: string
  label: string
  width?: string
  render?: (item: T) => ReactNode
  sortable?: boolean
}

export interface PaginatedTableTemplateProps<T = any> {
  // Data
  data: T[]
  columns: TableColumn<T>[]
  totalCount: number
  
  // Loading states
  isLoading: boolean
  error?: string
  
  // Pagination
  currentPage: number
  pageSize: number
  searchTerm: string
  
  // Actions
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSearchChange: (term: string) => void
  onRetry?: () => void
  
  // Header customization
  title: string
  headerActions?: ReactNode
  filters?: ReactNode
  
  // Row actions
  onRowSelect?: (item: T, selected: boolean) => void
  selectedItems?: Set<string | number>
  getItemId?: (item: T) => string | number
  rowActions?: (item: T) => ReactNode
  
  // Empty states
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  
  // Mobile responsive
  isMobile?: boolean
}

export function PaginatedTableTemplate<T = any>({
  data,
  columns,
  totalCount,
  isLoading,
  error,
  currentPage,
  pageSize,
  searchTerm,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onRetry,
  title,
  headerActions,
  filters,
  onRowSelect,
  selectedItems,
  getItemId,
  rowActions,
  emptyIcon,
  emptyTitle = "No se encontraron elementos",
  emptyDescription = "No hay elementos para mostrar",
  isMobile = false
}: PaginatedTableTemplateProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState(searchTerm)
  const totalPages = Math.ceil(totalCount / pageSize)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalSearchTerm !== searchTerm) {
        onSearchChange(internalSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [internalSearchTerm, searchTerm, onSearchChange])

  const handlePageSizeChange = (newSize: string) => {
    onPageSizeChange(Number(newSize))
    onPageChange(1) // Reset to page 1
  }

  const handleSearchChange = (value: string) => {
    setInternalSearchTerm(value)
    onPageChange(1) // Reset to page 1 when searching
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  disabled={isLoading}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  {isLoading ? 'Cargando...' : 'Reintentar'}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {headerActions && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {headerActions}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {filters}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={internalSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 md:w-64 h-10 md:h-9 text-base md:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {onRowSelect && (
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.width}>
                    {column.label}
                  </TableHead>
                ))}
                {rowActions && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: pageSize }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {onRowSelect && (
                      <TableCell>
                        <Skeleton className="w-4 h-4" />
                      </TableCell>
                    )}
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    ))}
                    {rowActions && (
                      <TableCell>
                        <Skeleton className="w-8 h-8" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onRowSelect ? 1 : 0) + (rowActions ? 1 : 0)} className="py-16">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar datos</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      {onRetry && (
                        <Button
                          onClick={onRetry}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Reintentar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onRowSelect ? 1 : 0) + (rowActions ? 1 : 0)} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        {emptyIcon}
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">{emptyTitle}</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {internalSearchTerm ? `No hay elementos que coincidan con "${internalSearchTerm}"` : emptyDescription}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => {
                  const itemId = getItemId ? getItemId(item) : index
                  const isSelected = selectedItems?.has(itemId) || false
                  
                  return (
                    <TableRow key={itemId}>
                      {onRowSelect && (
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => onRowSelect(item, !!checked)}
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.render ? column.render(item) : (item as any)[column.key]}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell>
                          {rowActions(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalCount > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, totalCount)} de {totalCount} resultados
              </div>
              
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 justify-center md:justify-start">
                  <span className="whitespace-nowrap">Filas por página</span>
                  <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-gray-600 whitespace-nowrap">Página {currentPage} de {totalPages}</span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    
                    {/* Page numbers - Fixed logic */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = []
                        const maxVisiblePages = isMobile ? 5 : 7
                        
                        if (totalPages <= maxVisiblePages) {
                          // Show all pages if few
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(
                              <Button
                                key={i}
                                variant={currentPage === i ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onPageChange(i)}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                {i}
                              </Button>
                            )
                          }
                        } else {
                          // First page
                          pages.push(
                            <Button
                              key={1}
                              variant={currentPage === 1 ? "default" : "ghost"}
                              size="sm"
                              onClick={() => onPageChange(1)}
                              className="w-8 h-8 p-0 text-xs"
                            >
                              1
                            </Button>
                          )
                          
                          let startPage = Math.max(2, currentPage - 1)
                          let endPage = Math.min(totalPages - 1, currentPage + 1)
                          
                          // Adjust to show enough pages
                          if (currentPage <= 3) {
                            endPage = Math.min(totalPages - 1, 4)
                          } else if (currentPage >= totalPages - 2) {
                            startPage = Math.max(2, totalPages - 3)
                          }
                          
                          // Initial ellipsis
                          if (startPage > 2) {
                            pages.push(<span key="dots1" className="px-1 text-gray-400 text-xs">...</span>)
                          }
                          
                          // Middle pages
                          for (let i = startPage; i <= endPage; i++) {
                            if (i !== 1 && i !== totalPages) {
                              pages.push(
                                <Button
                                  key={i}
                                  variant={currentPage === i ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => onPageChange(i)}
                                  className="w-8 h-8 p-0 text-xs"
                                >
                                  {i}
                                </Button>
                              )
                            }
                          }
                          
                          // Final ellipsis
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="dots2" className="px-1 text-gray-400 text-xs">...</span>)
                          }
                          
                          // Last page
                          if (totalPages > 1) {
                            pages.push(
                              <Button
                                key={totalPages}
                                variant={currentPage === totalPages ? "default" : "ghost"}
                                size="sm"
                                onClick={() => onPageChange(totalPages)}
                                className="w-8 h-8 p-0 text-xs"
                              >
                                {totalPages}
                              </Button>
                            )
                          }
                        }
                        
                        return pages
                      })()}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}