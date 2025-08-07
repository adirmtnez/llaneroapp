import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, StoreIcon, PackageIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon } from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { AddBodegonModal } from "../../modals/add-bodegon-modal"
import { EditBodegonModal } from "../../modals/edit-bodegon-modal"
import { DeleteConfirmationModal } from "../../modals/delete-confirmation-modal"
import { BodegonService } from "@/services/bodegons"
import { BodegonWithDetails } from "@/types/bodegons"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-screen"
import { toast } from "sonner"
import { useSupabaseQuery } from "@/contexts/supabase-context"
import { SupabaseClient } from "@supabase/supabase-js"

export function BodegonesLocView() {
  const [selectedFilter, setSelectedFilter] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null)
  const [bodegonToEdit, setBodegonToEdit] = useState<BodegonWithDetails | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [bodegones, setBodegones] = useState<BodegonWithDetails[]>([])
  const [error, setError] = useState<string>('')

  // Reset error state to show normal empty state
  useEffect(() => {
    setError('')
  }, [])

  const { user } = useAuth()
  const { executeQuery, isReady, sessionValid, sessionState } = useSupabaseQuery()

  const filterOptions = ['Todos', 'Activos', 'Inactivos']

  // Load bodegones from Supabase
  const loadBodegones = async () => {
    // Don't load if session is not ready or valid
    if (!isReady || !sessionValid) {
      console.log('SupabaseProvider not ready or session invalid:', { isReady, sessionValid, sessionState })
      return
    }
    
    try {
      console.log('Loading bodegones...')
      setIsLoading(true)
      setError('')
      
      const filters: any = {}
      if (selectedFilter !== 'Todos') {
        filters.is_active = selectedFilter === 'Activos'
      }
      if (searchTerm) {
        filters.search = searchTerm
      }

      console.log('Calling BodegonService.getAll with filters:', filters)
      
      const { data, error: serviceError } = await executeQuery(
        (client: SupabaseClient) => BodegonService.getAll(client, filters)
      )
      
      if (serviceError) {
        const errorMessage = 'Error al cargar bodegones: ' + serviceError.message
        console.error('Service error:', serviceError)
        setError(errorMessage)
        toast.error(errorMessage)
        setBodegones([])
        return
      }

      console.log('Bodegones loaded successfully:', data?.length || 0, 'items')
      setBodegones(data || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error && err.message === 'Request timeout' 
        ? 'La consulta tardó demasiado tiempo. Intenta de nuevo.'
        : 'Error inesperado al cargar bodegones'
      
      console.error('Error loading bodegones:', err)
      setError(errorMessage)
      toast.error(errorMessage)
      setBodegones([])
    } finally {
      console.log('Setting loading to false')
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

  // Load bodegones when session is ready and filters change
  useEffect(() => {
    if (isReady && sessionValid) {
      loadBodegones()
    }
  }, [isReady, sessionValid, selectedFilter, searchTerm])

  const paginatedBodegones = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return bodegones.slice(startIndex, startIndex + pageSize)
  }, [bodegones, currentPage, pageSize])

  const totalPages = Math.ceil(bodegones.length / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  const handleEditClick = (bodegon: BodegonWithDetails) => {
    setBodegonToEdit(bodegon)
    setShowEditModal(true)
  }

  const handleDeleteClick = (bodegon: {id: string, name: string}) => {
    setItemToDelete(bodegon)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    setIsDeleting(true)
    
    try {
      const { error: deleteError } = await executeQuery(
        (client: SupabaseClient) => BodegonService.hardDelete(client, itemToDelete.id)
      )
      
      if (deleteError) {
        toast.error('Error al eliminar bodegón: ' + deleteError.message)
        return
      }

      toast.success(`Bodegón "${itemToDelete.name}" eliminado exitosamente`)

      // Reload bodegones after successful deletion
      await loadBodegones()
      setShowDeleteModal(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('Error al eliminar:', error)
      toast.error('Error inesperado al eliminar bodegón')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddBodegonSuccess = () => {
    loadBodegones() // Reload data
  }

  const handleEditBodegonSuccess = () => {
    loadBodegones() // Reload data
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Bodegones</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadBodegones}
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
            className="whitespace-nowrap h-11 md:h-10 text-base md:text-sm"
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
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:flex-none">
                <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar bodegones..."
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
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar bodegones</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      <Button
                        onClick={loadBodegones}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedBodegones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <StoreIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">No se encontraron bodegones</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {searchTerm ? `No hay bodegones que coincidan con "${searchTerm}"` : 'No hay bodegones para mostrar'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBodegones.map((bodegon) => (
                  <TableRow key={bodegon.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <StoreIcon className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium">{bodegon.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{bodegon.product_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bodegon.is_active ? "default" : "secondary"} 
                             className={bodegon.is_active 
                               ? "bg-green-100 text-green-700 border-green-200" 
                               : "bg-gray-100 text-gray-700 border-gray-200"}>
                        {bodegon.is_active ? 'Activo' : 'Inactivo'}
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
                            onClick={() => handleEditClick(bodegon)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>Ver productos</DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleDeleteClick(bodegon)}
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

          {bodegones.length > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, bodegones.length)} de {bodegones.length} resultados
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

      <AddBodegonModal 
        open={showAddModal} 
        onOpenChange={setShowAddModal}
        onSuccess={handleAddBodegonSuccess}
      />

      <EditBodegonModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        onSuccess={handleEditBodegonSuccess}
        bodegon={bodegonToEdit}
      />

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={itemToDelete?.name || ""}
        itemType="bodegón"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  )
}