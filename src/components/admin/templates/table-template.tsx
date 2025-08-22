import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon } from "lucide-react"
import { useState, useMemo, useEffect, ReactNode } from "react"
import { toast } from "sonner"

export interface TableColumn<T = any> {
  key: string
  label: string
  render?: (item: T) => ReactNode
  sortable?: boolean
}

export interface FilterOption {
  label: string
  value: string
  color?: string
}

export interface TableTemplateProps<T = any> {
  title: string
  data: T[]
  columns: TableColumn<T>[]
  isLoading: boolean
  error?: string
  
  // Actions
  onAdd?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onReload?: () => void
  
  // Search and filters
  searchTerm: string
  onSearchChange: (term: string) => void
  searchPlaceholder?: string
  
  // Status filters
  statusFilters?: FilterOption[]
  selectedStatusFilters: string[]
  onStatusFiltersChange: (filters: string[]) => void
  
  // Pagination
  currentPage: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  
  // Custom elements
  headerActions?: ReactNode
  emptyStateIcon?: ReactNode
  emptyStateTitle?: string
  emptyStateDescription?: string
  
  // Row actions
  rowActions?: (item: T) => ReactNode
  
  // Mobile responsive
  isMobile?: boolean
}

export function TableTemplate<T extends { id: string }>({
  title,
  data,
  columns,
  isLoading,
  error,
  
  onAdd,
  onEdit,
  onDelete,
  onReload,
  
  searchTerm,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  
  statusFilters = [],
  selectedStatusFilters,
  onStatusFiltersChange,
  
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  
  headerActions,
  emptyStateIcon,
  emptyStateTitle = "No se encontraron elementos",
  emptyStateDescription,
  
  rowActions,
  
  isMobile = false
}: TableTemplateProps<T>) {
  
  // Pagination logic
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return data.slice(startIndex, startIndex + pageSize)
  }, [data, currentPage, pageSize])

  const totalPages = Math.ceil(data.length / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    onPageSizeChange(Number(newSize))
    onPageChange(1)
  }

  // Default row actions
  const defaultRowActions = (item: T) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 md:h-8">
          <MoreHorizontalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && (
          <DropdownMenuItem 
            className="cursor-pointer"
            onClick={() => onEdit(item)}
          >
            Editar
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem 
            className="text-red-600 cursor-pointer"
            onClick={() => onDelete(item)}
          >
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

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
              {onReload && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onReload}
                  disabled={isLoading}
                  className="ml-2 h-6 px-2 text-xs"
                >
                  {isLoading ? 'Cargando...' : 'Reintentar'}
                </Button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <UploadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
            <span className="sm:hidden">Import</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
                <span className="hidden sm:inline">Más acciones</span>
                <span className="sm:hidden">Más</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Exportar seleccionados</DropdownMenuItem>
              <DropdownMenuItem>Eliminar seleccionados</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onAdd && (
            <Button 
              size="sm" 
              className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
              onClick={onAdd}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          )}
          {headerActions}
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              {statusFilters.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                      <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                      Estado
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2">
                    <div className="space-y-2">
                      {statusFilters.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${option.value}`}
                            checked={selectedStatusFilters.includes(option.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onStatusFiltersChange([...selectedStatusFilters, option.value])
                              } else {
                                onStatusFiltersChange(selectedStatusFilters.filter(f => f !== option.value))
                              }
                            }}
                          />
                          <label
                            htmlFor={`status-${option.value}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option.color && (
                              <div className={`w-2 h-2 rounded-full ${option.color}`} />
                            )}
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 md:w-64"
                />
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-10 md:h-8">
                <FilterIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                {columns.map((column) => (
                  <TableHead key={column.key}>{column.label}</TableHead>
                ))}
                {(rowActions || onEdit || onDelete) && (
                  <TableHead className="w-12"></TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading state
                Array.from({ length: pageSize }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell>
                      <Skeleton className="w-4 h-4" />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                    ))}
                    {(rowActions || onEdit || onDelete) && (
                      <TableCell>
                        <Skeleton className="w-8 h-8" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="py-16">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar datos</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      {onReload && (
                        <Button
                          onClick={onReload}
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
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        {emptyStateIcon || <AlertCircleIcon className="w-8 h-8 text-gray-400" />}
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">{emptyStateTitle}</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {emptyStateDescription || (searchTerm ? `No hay elementos que coincidan con "${searchTerm}"` : 'No hay elementos para mostrar')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render ? column.render(item) : (item as any)[column.key]}
                      </TableCell>
                    ))}
                    {(rowActions || onEdit || onDelete) && (
                      <TableCell>
                        {rowActions ? rowActions(item) : defaultRowActions(item)}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {data.length > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, data.length)} de {data.length} resultados
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
                    
                    {/* Números de página - Simplificado para mobile */}
                    <div className="flex items-center gap-1">
                      {/* Primera página siempre visible */}
                      <Button
                        variant={currentPage === 1 ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange(1)}
                        className="w-8 h-8 p-0 text-xs"
                      >
                        1
                      </Button>
                      
                      {/* Solo mostrar páginas cercanas en mobile */}
                      {currentPage > 3 && totalPages > 4 && <span className="px-1 text-gray-400 text-xs">...</span>}
                      
                      {/* Mostrar menos páginas en mobile */}
                      {Array.from({ length: Math.min(isMobile ? 1 : 3, totalPages) }, (_, i) => {
                        const pageNum = Math.max(2, Math.min(currentPage - 1 + i, totalPages - 1));
                        if (pageNum === 1 || pageNum === totalPages) return null;
                        if (pageNum < 2 || pageNum > totalPages - 1) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                            className="w-8 h-8 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                      
                      {currentPage < totalPages - 2 && totalPages > 4 && <span className="px-1 text-gray-400 text-xs">...</span>}
                      
                      {/* Última página si hay más de 1 */}
                      {totalPages > 1 && (
                        <Button
                          variant={currentPage === totalPages ? "default" : "ghost"}
                          size="sm"
                          onClick={() => onPageChange(totalPages)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {totalPages}
                        </Button>
                      )}
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