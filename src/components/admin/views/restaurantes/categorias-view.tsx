'use client'

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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Label } from "@/components/ui/label"
import { DownloadIcon, UploadIcon, PlusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon, AlertCircleIcon, CirclePlusIcon, ImageIcon, PackageIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { useState, useMemo, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { DeleteConfirmationModal } from '@/components/admin/modals/delete-confirmation-modal'
import { 
  RestaurantCategoryService, 
  RestaurantCategoryWithDetails 
} from '@/services/restaurant-categories'
import { RestaurantCategory } from '@/types/restaurants'

type CategoryStatusFilter = 'Activos' | 'Inactivos'

export function RestaurantesCatView() {
  const [selectedFilters, setSelectedFilters] = useState<CategoryStatusFilter[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [categories, setCategories] = useState<RestaurantCategoryWithDetails[]>([])
  const [error, setError] = useState<string>('')
  const [totalCount, setTotalCount] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<RestaurantCategory | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RestaurantCategory | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    restaurant_id: '',
    is_active: true
  })
  const [restaurants, setRestaurants] = useState<any[]>([])

  const { user } = useAuth()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Reset to page 1 when search or filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedFilters])

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const { data, error } = await RestaurantCategoryService.getAll()
      
      if (error) {
        setError('Error al cargar categorías')
        return
      }
      
      setCategories(data || [])
      setTotalCount(data?.length || 0)
    } catch (error) {
      setError('Error inesperado al cargar categorías')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadRestaurants = useCallback(async () => {
    try {
      // Importar el servicio de restaurantes
      const { RestaurantService } = await import('@/services/restaurants')
      // Necesitamos usar un cliente Supabase, por ahora usaremos nuclear client
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          return await client
            .from('restaurants')
            .select('id, name')
            .eq('is_active', true)
            .order('name')
        },
        false
      )
      
      if (!error && data) {
        setRestaurants(data)
      }
    } catch (error) {
      console.error('Error cargando restaurantes:', error)
    }
  }, [])

  useEffect(() => {
    loadCategories()
    loadRestaurants()
  }, [loadCategories, loadRestaurants])

  // Filter and search logic
  const filteredCategories = useMemo(() => {
    let filtered = categories

    // Apply status filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(category => {
        if (selectedFilters.includes('Activos') && category.is_active) return true
        if (selectedFilters.includes('Inactivos') && !category.is_active) return true
        return false
      })
    }

    // Apply search filter
    if (debouncedSearchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    return filtered
  }, [categories, selectedFilters, debouncedSearchTerm])

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / pageSize)
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredCategories.slice(startIndex, startIndex + pageSize)
  }, [filteredCategories, currentPage, pageSize])

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }


  const handleDeleteClick = (category: RestaurantCategory) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      setDeletingId(categoryToDelete.id)
      
      // Verificar si la categoría tiene productos asociados
      const categoryWithDetails = categories.find(cat => cat.id === categoryToDelete.id) as RestaurantCategoryWithDetails
      if (categoryWithDetails?.product_count && categoryWithDetails.product_count > 0) {
        toast.error(`No se puede eliminar la categoría "${categoryToDelete.name}" porque tiene ${categoryWithDetails.product_count} producto(s) asociado(s). Elimina o reasigna los productos primero.`)
        setDeletingId(null)
        return
      }
      
      const { error } = await RestaurantCategoryService.delete(categoryToDelete.id)
      
      if (error) {
        toast.error('Error al eliminar categoría')
        return
      }

      toast.success('Categoría eliminada exitosamente')
      loadCategories()
    } catch (error) {
      toast.error('Error inesperado al eliminar categoría')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    }
  }

  const handleEditClick = (category: RestaurantCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      restaurant_id: category.restaurant_id || '',
      is_active: category.is_active
    })
    if (category.image_url) {
      setImagePreview(category.image_url)
    }
    setShowEditCategoryModal(true)
  }

  const handleCloseAddModal = () => {
    setShowAddCategoryModal(false)
    setFormData({ name: '', restaurant_id: '', is_active: true })
    setImageFile(null)
    setImagePreview('')
    setIsSubmitting(false)
  }

  const handleCloseEditModal = () => {
    setShowEditCategoryModal(false)
    setEditingCategory(null)
    setFormData({ name: '', restaurant_id: '', is_active: true })
    setImageFile(null)
    setImagePreview('')
    setIsSubmitting(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!formData.restaurant_id) {
      toast.error('Debes seleccionar un restaurante')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Preparar datos para crear
      const categoryData: any = {
        name: formData.name.trim(),
        restaurant_id: formData.restaurant_id,
        is_active: formData.is_active,
        created_by: user?.auth_user?.id,
        created_at: new Date().toISOString()
      }

      // Si hay imagen, primero la subimos
      if (imageFile) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          const imageUrl = await S3StorageService.uploadRestaurantCategoryImage(imageFile)
          categoryData.image = imageUrl
        } catch (imageError) {
          toast.error('Error al subir la imagen')
          return
        }
      }

      const { error } = await RestaurantCategoryService.create(categoryData)

      if (error) {
        toast.error('Error al crear categoría')
        return
      }

      toast.success('Categoría creada exitosamente')
      handleCloseAddModal()
      loadCategories()
    } catch (error) {
      toast.error('Error inesperado al crear categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditCategory = async () => {
    if (!formData.name.trim() || !editingCategory) {
      toast.error('El nombre es requerido')
      return
    }

    if (!formData.restaurant_id) {
      toast.error('Debes seleccionar un restaurante')
      return
    }

    try {
      setIsSubmitting(true)
      
      // Preparar datos para actualizar
      const updateData: any = {
        name: formData.name.trim(),
        restaurant_id: formData.restaurant_id,
        is_active: formData.is_active
      }

      // Si hay nueva imagen, la subimos
      if (imageFile) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          const imageUrl = await S3StorageService.uploadRestaurantCategoryImage(imageFile)
          updateData.image = imageUrl
        } catch (imageError) {
          toast.error('Error al subir la imagen')
          return
        }
      }

      const { error } = await RestaurantCategoryService.update(editingCategory.id, updateData)

      if (error) {
        toast.error('Error al actualizar categoría')
        return
      }

      toast.success('Categoría actualizada exitosamente')
      handleCloseEditModal()
      loadCategories()
    } catch (error) {
      toast.error('Error inesperado al actualizar categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Categorías de Restaurantes
          </h1>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Button 
            onClick={() => setShowAddCategoryModal(true)}
            size="sm" 
            className="h-10 md:h-8 text-base md:text-sm"
          >
            <CirclePlusIcon className="w-4 h-4 mr-2" />
            Agregar Categoría
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(['Activos', 'Inactivos'] as CategoryStatusFilter[]).map((option) => (
                      <div key={option} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option}`}
                          checked={selectedFilters.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFilters([...selectedFilters, option])
                            } else {
                              setSelectedFilters(selectedFilters.filter(f => f !== option))
                            }
                          }}
                        />
                        <label
                          htmlFor={`status-${option}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <div className={`w-2 h-2 rounded-full ${
                            option === 'Activos' ? 'bg-green-500' :
                            option === 'Inactivos' ? 'bg-gray-400' :
                            'bg-blue-500'
                          }`}></div>
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
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 md:w-64 h-10 md:h-9 text-base md:text-sm"
                />
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-left">
                  <Checkbox />
                </TableHead>
                <TableHead className="text-left">Nombre</TableHead>
                <TableHead className="text-left">Productos</TableHead>
                <TableHead className="text-left">Estado</TableHead>
                <TableHead className="w-12 text-left"></TableHead>
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
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="flex flex-col gap-1">
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
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
                      <p className="text-lg font-medium text-red-700 mb-1">Error al cargar categorías</p>
                      <p className="text-sm text-red-500 text-center max-w-md mb-4">
                        {error}
                      </p>
                      <Button
                        onClick={() => loadCategories()}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Reintentar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <TagIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-1">No se encontraron categorías</p>
                      <p className="text-sm text-gray-500 text-center max-w-md">
                        {searchTerm ? `No hay categorías que coincidan con "${searchTerm}"` : 'No hay categorías para mostrar'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img 
                            src={category.image_url} 
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center ${
                            category.image_url ? 'hidden' : ''
                          }`}
                          style={{ display: category.image_url ? 'none' : 'flex' }}
                        >
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1 pr-4">
                          <span className="font-medium text-sm">{category.name}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <div className="flex items-center gap-2">
                        <PackageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-400">{category.product_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge 
                        variant={category.is_active ? "default" : "secondary"} 
                        className={category.is_active 
                          ? "bg-green-100 text-green-700 border-green-200" 
                          : "bg-gray-100 text-gray-700 border-gray-200"}
                      >
                        {category.is_active ? 'Activo' : 'Inactivo'}
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
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleEditClick(category)
                            }}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className={`cursor-pointer ${(category.product_count && category.product_count > 0) ? 'text-gray-400 cursor-not-allowed' : 'text-red-600'}`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (!(category.product_count && category.product_count > 0)) {
                                handleDeleteClick(category)
                              }
                            }}
                            disabled={deletingId === category.id || (category.product_count && category.product_count > 0)}
                          >
                            {deletingId === category.id 
                              ? 'Eliminando...' 
                              : (category.product_count && category.product_count > 0)
                                ? `No se puede eliminar (${category.product_count} productos)`
                                : 'Eliminar'
                            }
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalCount > 0 && (
            <div className="flex flex-col gap-4 px-4 py-4 border-t md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-gray-600 text-center md:text-left">
                Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, filteredCategories.length)} de {filteredCategories.length} resultados
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
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeftIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="h-8 w-8 p-0"
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

      {/* Add Category Modal - Desktop */}
      {!isMobile ? (
        <Dialog open={showAddCategoryModal} onOpenChange={handleCloseAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Categoría</DialogTitle>
              <DialogDescription>
                Completa la información para crear una nueva categoría de productos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Bebidas, Snacks, Lácteos..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 md:h-9 text-base md:text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurante *</Label>
                <Select 
                  value={formData.restaurant_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto de portada</Label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    id="categoryImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {imageFile ? (
                      <div className="flex items-center gap-3 text-green-600">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{imageFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG o WebP (máx. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={formData.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Activo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactivo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseAddModal}
                disabled={isSubmitting}
                className="h-11 md:h-10 text-base md:text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={isSubmitting || !formData.name.trim() || !formData.restaurant_id}
                className="h-11 md:h-10 text-base md:text-sm"
              >
                {isSubmitting ? 'Creando...' : 'Crear Categoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        /* Add Category Drawer - Mobile */
        <Drawer open={showAddCategoryModal} onOpenChange={handleCloseAddModal}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Agregar Nueva Categoría</DrawerTitle>
              <DrawerDescription>
                Completa la información para crear una nueva categoría de productos.
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-name">Nombre *</Label>
                <Input
                  id="drawer-name"
                  placeholder="Ej: Bebidas, Snacks, Lácteos..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 text-base"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurante *</Label>
                <Select 
                  value={formData.restaurant_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto de portada</Label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    id="drawerCategoryImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {imageFile ? (
                      <div className="flex items-center gap-3 text-green-600">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{imageFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG o WebP (máx. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={formData.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Activo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactivo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={handleAddCategory}
                disabled={isSubmitting || !formData.name.trim() || !formData.restaurant_id}
                className="h-11 text-base"
              >
                {isSubmitting ? 'Creando...' : 'Crear Categoría'}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-11 text-base"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Edit Category Modal - Desktop */}
      {!isMobile ? (
        <Dialog open={showEditCategoryModal} onOpenChange={handleCloseEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Categoría</DialogTitle>
              <DialogDescription>
                Modifica la información de la categoría.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre *</Label>
                <Input
                  id="edit-name"
                  placeholder="Ej: Bebidas, Snacks, Lácteos..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 md:h-9 text-base md:text-sm"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurante *</Label>
                <Select 
                  value={formData.restaurant_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto de portada</Label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    id="editCategoryImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {imageFile ? (
                      <div className="flex items-center gap-3 text-green-600">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{imageFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG o WebP (máx. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={formData.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Activo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactivo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={isSubmitting}
                className="h-11 md:h-10 text-base md:text-sm"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={isSubmitting || !formData.name.trim() || !formData.restaurant_id}
                className="h-11 md:h-10 text-base md:text-sm"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        /* Edit Category Drawer - Mobile */
        <Drawer open={showEditCategoryModal} onOpenChange={handleCloseEditModal}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar Categoría</DrawerTitle>
              <DrawerDescription>
                Modifica la información de la categoría.
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 space-y-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-edit-name">Nombre *</Label>
                <Input
                  id="drawer-edit-name"
                  placeholder="Ej: Bebidas, Snacks, Lácteos..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 text-base"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Restaurante *</Label>
                <Select 
                  value={formData.restaurant_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue placeholder="Selecciona un restaurante" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto de portada</Label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-gray-400 transition-colors cursor-pointer">
                  <input
                    id="drawerEditCategoryImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-col items-center justify-center text-center">
                    {imageFile ? (
                      <div className="flex items-center gap-3 text-green-600">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-gray-900">{imageFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Haz clic para subir una imagen
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG o WebP (máx. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select 
                  value={formData.is_active ? "active" : "inactive"} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-10 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Activo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        Inactivo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={handleEditCategory}
                disabled={isSubmitting || !formData.name.trim() || !formData.restaurant_id}
                className="h-11 text-base"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  className="h-11 text-base"
                >
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={categoryToDelete?.name || ''}
        itemType="categoría"
        isLoading={!!deletingId}
        requireNameConfirmation={false}
      />
    </div>
  )
}