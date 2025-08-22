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
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, UtensilsCrossedIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { RestaurantWithDetails } from "@/services/restaurants"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { AddRestaurantModal } from "../../modals/add-restaurant-modal"
import { EditRestaurantModal } from "../../modals/edit-restaurant-modal"
import { DeleteConfirmationModal } from "../../modals/delete-confirmation-modal"

export function RestaurantesLocView() {
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null)
  const [restaurantToEdit, setRestaurantToEdit] = useState<RestaurantWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [restaurants, setRestaurants] = useState<RestaurantWithDetails[]>([])
  const [error, setError] = useState<string>('')

  // Reset error state to show normal empty state
  useEffect(() => {
    setError('')
  }, [])

  const { user } = useAuth()

  const statusFilterOptions = ['Activos', 'Inactivos']

  // Load restaurants from Supabase
  const loadRestaurants = async (isMountedRef?: { current: boolean }) => {
    // ✅ Check if component is still mounted before setState
    if (isMountedRef && !isMountedRef.current) return
    
    try {
      setIsLoading(true)
      setError('')
      
      const filters: Record<string, unknown> = {}
      if (selectedStatusFilters.length > 0) {
        // If both Activos and Inactivos are selected, don't apply filter (show all)
        if (selectedStatusFilters.length === 1) {
          filters.is_active = selectedStatusFilters.includes('Activos')
        }
      }
      if (searchTerm) {
        filters.search = searchTerm
      }

      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada  
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      // 🚀 Query usando Nuclear Client V2.0 con auto-recovery
      const { data: restaurants, error: serviceError } = await executeNuclearQuery(
        async (client) => {
          let query = client.from('restaurants').select('*')
          
          // Aplicar filtros
          if (filters.is_active !== undefined) {
            query = query.eq('is_active', filters.is_active)
          }
          if (filters.search) {
            query = query.ilike('name', `%${filters.search}%`)
          }
          
          query = query.order('name', { ascending: true })
          return await query
        },
        false // No mostrar toast automático en este caso
      )
      
      if (serviceError || !restaurants) {
        const errorMessage = serviceError || 'Error al cargar restaurantes'
        setError(errorMessage)
        toast.error(errorMessage)
        setRestaurants([])
        return
      }

      // ✅ Temporalmente sin conteo de productos hasta verificar estructura de BD
      const transformedData = restaurants.map((restaurant) => ({
        ...restaurant, 
        product_count: 0 // Placeholder hasta verificar estructura de BD
      }))

      setRestaurants(transformedData)
      
    } catch (err) {
      const errorMessage = err instanceof Error && err.message === 'Request timeout' 
        ? 'La consulta tardó demasiado tiempo. Intenta de nuevo.'
        : 'Error inesperado al cargar restaurantes'
      
      setError(errorMessage)
      toast.error(errorMessage)
      setRestaurants([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load restaurants when session is ready and filters change
  useEffect(() => {
    let isMounted = true // ✅ Flag para prevenir setState en componentes desmontados

    const loadData = async () => {
      if (!isMounted) return
      
      try {
        await loadRestaurants()
      } catch (error) {
        if (isMounted) {
          console.error('Error loading restaurants:', error)
          setError('Error al cargar restaurantes')
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      // ✅ Cleanup para prevenir procesos colgantes
      isMounted = false
      setIsLoading(false)
    }
  }, [selectedStatusFilters, searchTerm])

  const paginatedRestaurants = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return restaurants.slice(startIndex, startIndex + pageSize)
  }, [restaurants, currentPage, pageSize])

  const totalPages = Math.ceil(restaurants.length / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  const handleEditClick = (restaurant: RestaurantWithDetails) => {
    setRestaurantToEdit(restaurant)
    setShowEditModal(true)
  }

  const handleDeleteClick = (restaurant: {id: string, name: string}) => {
    setItemToDelete(restaurant)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    setIsDeleting(true)
    
    try {
      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada
      const { executeNuclearQuery, nuclearDelete } = await import('@/utils/nuclear-client')
      
      // 1. Obtener restaurante para verificar si tiene logo
      const { data: restaurant, error: getError } = await executeNuclearQuery(
        async (client) => {
          const { data, error } = await client
            .from('restaurants')
            .select('logo_url')
            .eq('id', itemToDelete.id)
            .single()
          return { data, error }
        }
      )

      if (getError || !restaurant) {
        setIsDeleting(false)
        return // Error ya manejado por Nuclear Client
      }

      // 2. [Temporalmente omitido] Eliminar productos relacionados
      // TODO: Verificar estructura de BD para productos de restaurantes

      // 3. Eliminar logo del storage si existe
      if (restaurant?.logo_url) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          await S3StorageService.deleteRestaurantLogo(restaurant.logo_url)
        } catch (logoError) {
          // Continue even if logo deletion fails
        }
      }

      // 4. Eliminar restaurante usando Nuclear Delete V2.0
      const { error: deleteError } = await nuclearDelete('restaurants', itemToDelete.id)
      
      if (deleteError) {
        setIsDeleting(false)
        return // Error ya manejado por Nuclear Client
      }

      toast.success(`Restaurante "${itemToDelete.name}" eliminado exitosamente`)

      // Reload restaurants after successful deletion
      await loadRestaurants()
      setShowDeleteModal(false)
      setItemToDelete(null)
      
    } catch (error) {
      toast.error('Error inesperado al eliminar restaurante')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddRestaurantSuccess = () => {
    loadRestaurants() // Reload data
  }

  const handleEditRestaurantSuccess = () => {
    loadRestaurants() // Reload data
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Restaurantes</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadRestaurants()}
                disabled={isLoading}
                className="ml-2 h-6 px-2 text-xs"
              >
                {isLoading ? 'Cargando...' : 'Reintentar'}
              </Button>
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
          <Button 
            size="sm" 
            className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 p-4 border-b md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10 md:h-9 text-base md:text-sm justify-start">
                    <CirclePlusIcon className="w-4 h-4 text-gray-600 mr-1.5" />
                    Estado
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
                        <label
                          htmlFor={`status-${option}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            option === 'Activos' 
                              ? 'bg-green-500' 
                              : 'bg-gray-500'
                          }`} />
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar restaurantes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 md:w-64"
                />
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-10 md:h-8">
                <FilterIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="w-12"></TableHead>
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
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="w-8 h-8" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center text-red-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center">
                        <AlertCircleIcon className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar restaurantes</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      <Button
                        onClick={() => loadRestaurants()}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedRestaurants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <UtensilsCrossedIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">No se encontraron restaurantes</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {searchTerm ? `No hay restaurantes que coincidan con "${searchTerm}"` : 'No hay restaurantes para mostrar'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <UtensilsCrossedIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{restaurant.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{restaurant.product_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={restaurant.is_active ? "default" : "secondary"} 
                             className={restaurant.is_active 
                               ? "bg-green-100 text-green-700 border-green-200" 
                               : "bg-gray-100 text-gray-700 border-gray-200"}>
                        {restaurant.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-10 md:h-8">
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleEditClick(restaurant)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(restaurant)}
                          >
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {restaurants.length > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, restaurants.length)} de {restaurants.length} resultados
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
                      onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(1)}
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
                            onClick={() => setCurrentPage(pageNum)}
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
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-8 h-8 p-0 text-xs"
                        >
                          {totalPages}
                        </Button>
                      )}
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

      <AddRestaurantModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={handleAddRestaurantSuccess}
      />

      <EditRestaurantModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        onSuccess={handleEditRestaurantSuccess}
        restaurant={restaurantToEdit}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={itemToDelete?.name || ""}
        itemType="restaurante"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        requireNameConfirmation={true}
      />
    </div>
  )
}