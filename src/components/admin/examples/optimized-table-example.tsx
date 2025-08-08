/**
 * EJEMPLO DE IMPLEMENTACIÓN - Tabla Optimizada con Paginación Server-Side
 * 
 * Este es un ejemplo completo de cómo implementar una tabla optimizada
 * usando los templates y hooks creados. Copia y adapta este código
 * para crear nuevas tablas con paginación del servidor.
 */

import { useState, useCallback } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusIcon, MoreHorizontalIcon, PackageIcon, CirclePlusIcon } from "lucide-react"

// Importar nuestros templates y hooks
import { PaginatedTableTemplate, TableColumn } from '@/components/admin/templates/paginated-table-template'
import { usePaginatedData } from '@/hooks/use-paginated-data'
import { executePaginatedQuery, buildStatusFilters } from '@/utils/supabase-query-builder'

// Tipos de datos para este ejemplo
interface ExampleItem {
  id: string
  name: string
  code: string
  is_active: boolean
  category_name: string
  created_date: string
}

interface ExampleFilters {
  statusFilters: string[]
  selectedCategories: string[]
}

export function OptimizedTableExample() {
  // Estados locales para filtros
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  // Opciones de filtros
  const statusFilterOptions = ['Activos', 'Inactivos']
  const categoryOptions = [
    { id: '1', name: 'Categoría A' },
    { id: '2', name: 'Categoría B' },
    { id: '3', name: 'Categoría C' }
  ]

  // 🚀 PASO 1: Crear el query builder
  const queryBuilder = useCallback(async (params) => {
    // Construir filtros de estado usando helper
    const statusFilters = buildStatusFilters(params.filters.statusFilters || [], {
      'Activos': 'is_active.eq.true',
      'Inactivos': 'is_active.eq.false'
    })

    // Ejecutar query paginada optimizada
    return await executePaginatedQuery<ExampleItem>({
      tableName: 'mi_tabla_ejemplo',
      select: `
        id,
        name,
        code,
        is_active,
        created_date,
        categories!category_id(name)
      `,
      currentPage: params.currentPage,
      pageSize: params.pageSize,
      searchTerm: params.searchTerm,
      searchColumns: ['name', 'code'], // Columnas donde buscar
      filters: {
        category_id: params.filters.selectedCategories?.length > 0 ? params.filters.selectedCategories : undefined
      },
      orFilters: statusFilters,
      orderBy: { column: 'created_date', ascending: false }
    })
  }, [])

  // 🚀 PASO 2: Usar el hook de datos paginados
  const {
    data,
    totalCount,
    isLoading,
    error,
    currentPage,
    pageSize,
    searchTerm,
    setCurrentPage,
    setPageSize,
    setSearchTerm,
    setFilters,
    refetch
  } = usePaginatedData<ExampleItem>(queryBuilder, {
    initialPageSize: 25, // Tamaño inicial de página
    debounceMs: 500     // Delay para búsqueda
  })

  // Actualizar filtros cuando cambian los estados locales
  const handleFiltersChange = useCallback(() => {
    setFilters({
      statusFilters: selectedStatusFilters,
      selectedCategories: selectedCategories
    })
  }, [selectedStatusFilters, selectedCategories, setFilters])

  // Ejecutar cuando cambian los filtros
  useState(() => {
    handleFiltersChange()
  })

  // 🚀 PASO 3: Definir columnas de la tabla
  const columns: TableColumn<ExampleItem>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{item.name}</span>
          <span className="text-xs text-gray-500">Código: {item.code}</span>
        </div>
      )
    },
    {
      key: 'category_name',
      label: 'Categoría'
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (item) => (
        <Badge variant={item.is_active ? "default" : "secondary"}>
          {item.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    {
      key: 'created_date',
      label: 'Fecha Creación',
      render: (item) => (
        <span className="text-sm text-gray-600">
          {new Date(item.created_date).toLocaleDateString()}
        </span>
      )
    }
  ]

  // 🚀 PASO 4: Definir acciones de header
  const headerActions = (
    <>
      <Button variant="outline" size="sm" className="h-10 md:h-8 text-base md:text-sm">
        <PlusIcon className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      <Button size="sm" className="h-10 md:h-8 text-base md:text-sm">
        <PlusIcon className="w-4 h-4 mr-2" />
        Agregar
      </Button>
    </>
  )

  // 🚀 PASO 5: Definir filtros
  const filters = (
    <>
      {/* Filtro de Estado */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
            <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
            Estado
            {selectedStatusFilters.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {selectedStatusFilters.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="space-y-2">
            {statusFilterOptions.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option}`}
                  checked={selectedStatusFilters.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStatusFilters([...selectedStatusFilters, option])
                    } else {
                      setSelectedStatusFilters(selectedStatusFilters.filter(f => f !== option))
                    }
                  }}
                />
                <label htmlFor={`status-${option}`} className="text-sm cursor-pointer">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Filtro de Categoría */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
            <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
            Categoría
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {selectedCategories.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="space-y-2">
            {categoryOptions.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedCategories([...selectedCategories, category.id])
                    } else {
                      setSelectedCategories(selectedCategories.filter(c => c !== category.id))
                    }
                  }}
                />
                <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )

  // 🚀 PASO 6: Definir acciones de fila
  const rowActions = (item: ExampleItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontalIcon className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => console.log('Editar', item)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="text-red-600"
          onClick={() => console.log('Eliminar', item)}
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  // 🚀 PASO 7: Renderizar el template
  return (
    <PaginatedTableTemplate<ExampleItem>
      // Datos
      data={data}
      columns={columns}
      totalCount={totalCount}
      
      // Estados de carga
      isLoading={isLoading}
      error={error}
      
      // Paginación
      currentPage={currentPage}
      pageSize={pageSize}
      searchTerm={searchTerm}
      
      // Acciones
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
      onSearchChange={setSearchTerm}
      onRetry={refetch}
      
      // Personalización de header
      title="Mi Tabla Optimizada"
      headerActions={headerActions}
      filters={filters}
      
      // Acciones de fila
      rowActions={rowActions}
      getItemId={(item) => item.id}
      
      // Estados vacíos
      emptyIcon={<PackageIcon className="w-8 h-8 text-gray-400" />}
      emptyTitle="No se encontraron elementos"
      emptyDescription="No hay elementos para mostrar con los filtros actuales"
    />
  )
}

/**
 * 📝 INSTRUCCIONES PARA USAR ESTE EJEMPLO:
 * 
 * 1. Copia este archivo y renómbralo para tu tabla específica
 * 2. Cambia el tipo `ExampleItem` por tu tipo de datos
 * 3. Actualiza `tableName` y `select` en executePaginatedQuery
 * 4. Modifica `searchColumns` según las columnas donde quieras buscar
 * 5. Ajusta `columns` para definir cómo mostrar tus datos
 * 6. Personaliza `filters` según los filtros que necesites
 * 7. Implementa las acciones reales en `rowActions`
 * 
 * ¡Y listo! Tendrás una tabla optimizada con paginación server-side.
 * 
 * 🎯 BENEFICIOS AUTOMÁTICOS:
 * - Carga solo los datos necesarios
 * - Búsqueda con debounce
 * - Paginación inteligente
 * - Estados de carga y error
 * - Mobile responsive
 * - Filtros múltiples
 * - Skeletons durante carga
 */