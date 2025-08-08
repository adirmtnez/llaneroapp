"use client"

import { useState, useMemo, useEffect } from "react"
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
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, MoreHorizontalIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon } from "lucide-react"

interface FilterOption {
  id: string
  name: string
  color?: string
}

interface TableColumn {
  key: string
  label: string
  render?: (item: Record<string, unknown>) => React.ReactNode
}

interface TableViewTemplateProps {
  title: string
  data: Record<string, unknown>[]
  columns: TableColumn[]
  totalCount: number
  isLoading?: boolean
  error?: string
  statusFilters?: FilterOption[]
  categoryFilters?: FilterOption[]
  subcategoryFilters?: FilterOption[]
  onAdd: () => void
  onEdit: (item: Record<string, unknown>) => void
  onDelete: (item: Record<string, unknown>) => void
  onRefresh?: () => void
  onExport?: () => void
  onImport?: () => void
  customActions?: React.ReactNode
}

export function TableViewTemplate({ 
  title, 
  data, 
  columns,
  totalCount,
  isLoading = false,
  error,
  statusFilters = [],
  categoryFilters = [],
  subcategoryFilters = [],
  onAdd, 
  onEdit, 
  onDelete,
  onRefresh,
  onExport,
  onImport,
  customActions
}: TableViewTemplateProps) {
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([])
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<string[]>([])
  const [selectedSubcategoryFilters, setSelectedSubcategoryFilters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isMobile, setIsMobile] = useState(false)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const totalPages = Math.ceil(totalCount / pageSize)
  const paginatedData = data // Data should already be paginated from parent

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
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
          {onExport && (
            <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm" onClick={onExport}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Exportar</span>
              <span className="sm:hidden">Export</span>
            </Button>
          )}
          {onImport && (
            <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm" onClick={onImport}>
              <UploadIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Importar</span>
              <span className="sm:hidden">Import</span>
            </Button>
          )}
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
          {customActions}
          <Button 
            size="sm" 
            className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
            onClick={onAdd}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

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
                      {selectedStatusFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 text-xs">
                          {selectedStatusFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {statusFilters.map((option) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`status-${option.id}`}
                            checked={selectedStatusFilters.includes(option.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatusFilters([...selectedStatusFilters, option.id])
                              } else {
                                setSelectedStatusFilters(selectedStatusFilters.filter(f => f !== option.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`status-${option.id}`}
                            className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {option.color && (
                              <div className={`w-2 h-2 rounded-full ${option.color}`}></div>
                            )}
                            {option.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Category Filter */}
              {categoryFilters.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                      <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                      Categoría
                      {selectedCategoryFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 text-xs">
                          {selectedCategoryFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {categoryFilters.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategoryFilters.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategoryFilters([...selectedCategoryFilters, category.id])
                              } else {
                                setSelectedCategoryFilters(selectedCategoryFilters.filter(c => c !== category.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`category-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Subcategory Filter */}
              {subcategoryFilters.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                      <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                      Subcategoría
                      {selectedSubcategoryFilters.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 text-xs">
                          {selectedSubcategoryFilters.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2">
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {subcategoryFilters.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`subcategory-${subcategory.id}`}
                            checked={selectedSubcategoryFilters.includes(subcategory.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubcategoryFilters([...selectedSubcategoryFilters, subcategory.id])
                              } else {
                                setSelectedSubcategoryFilters(selectedSubcategoryFilters.filter(s => s !== subcategory.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={`subcategory-${subcategory.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {subcategory.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 md:w-64 h-10 md:h-9 text-base md:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.key === 'actions' ? 'text-right' : ''}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: pageSize }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        <Skeleton className={`h-4 ${
                          column.key === 'name' ? 'w-32' :
                          column.key === 'status' ? 'w-16' :
                          column.key === 'actions' ? 'w-8 ml-auto' :
                          'w-20'
                        }`} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                   <TableRow key={String(item.id) || `row-${index}`}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.key === 'name' ? 'font-medium' : ''}>
                        {column.render ? column.render(item) : (
                          column.key === 'actions' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-10 md:h-8">
                                  <MoreHorizontalIcon className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onDelete(item)}
                                  className="text-red-600"
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            String(item[column.key] || '')
                          )
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">No hay datos disponibles</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        Cuando agregues elementos, aparecerán aquí
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Advanced Pagination */}
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
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-1 w-8 h-8"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    
                    {/* Page Numbers with Ellipsis */}
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
                                onClick={() => setCurrentPage(i)}
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
                              onClick={() => setCurrentPage(1)}
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
                                  onClick={() => setCurrentPage(i)}
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
                                onClick={() => setCurrentPage(totalPages)}
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
                      onClick={() => setCurrentPage(currentPage + 1)}
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