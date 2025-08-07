"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon } from "lucide-react"

interface TableViewTemplateProps {
  title: string
  data: any[]
  onAdd: () => void
  onEdit: (item: any) => void
  onDelete: (item: any) => void
}

export function TableViewTemplate({ title, data, onAdd, onEdit, onDelete }: TableViewTemplateProps) {
  const [selectedFilter, setSelectedFilter] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(false)

  const filterOptions = ['Todos', 'Activos', 'Inactivos']

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesFilter = selectedFilter === 'Todos' || item.status === selectedFilter
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [data, selectedFilter, searchTerm])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h1>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm">
            <UploadIcon className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Importar</span>
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
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsLoading(!isLoading)}
            className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
          >
            {isLoading ? 'Ocultar' : 'Mostrar'} Skeleton
          </Button>
          <Button 
            size="sm" 
            className="whitespace-nowrap h-11 md:h-10 text-base md:text-sm"
            onClick={onAdd}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Filters */}
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex rounded-md border w-full md:w-auto">
              {filterOptions.map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "ghost"}
                  size="sm"
                  className="rounded-none first:rounded-l-md last:rounded-r-md flex-1 md:flex-none h-10 md:h-8 text-base md:text-sm"
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
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
              <Button variant="outline" size="sm" className="shrink-0 h-10 md:h-8">
                <FilterIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Activo' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.products}</TableCell>
                    <TableCell>
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
                          <DropdownMenuItem>Ver productos</DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(item)}
                            className="text-red-600"
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Empty state
                <TableRow>
                  <TableCell colSpan={4}>
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

          {/* Pagination */}
          {!isLoading && paginatedData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-20 h-10 md:h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">de {filteredData.length}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="h-10 md:h-8"
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 md:h-8"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}