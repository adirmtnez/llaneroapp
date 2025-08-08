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

interface Category {
  id: string
  name: string
  image?: string | null
  is_active: boolean
  created_date: string
  modified_date?: string
  created_by?: string
}

interface CategoryWithDetails extends Category {
  product_count?: number
}

type CategoryStatusFilter = 'Activos' | 'Inactivos'

export function BodegonesCatView() {
  const [selectedFilters, setSelectedFilters] = useState<CategoryStatusFilter[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [categories, setCategories] = useState<CategoryWithDetails[]>([])
  const [error, setError] = useState<string>('')
  const [totalCount, setTotalCount] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null)
  
  // Form states for adding/editing category
  const [formData, setFormData] = useState({
    name: '',
    is_active: true
  })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()

  const filterOptions: CategoryStatusFilter[] = ['Activos', 'Inactivos']

  // Load categories from Supabase with nuclear solution
  const loadCategories = async (isMountedRef?: { current: boolean }) => {
    
    if (isMountedRef && !isMountedRef.current) return
    
    try {
      setIsLoading(true)
      setError('')

      // ✅ SOLUCIÓN NUCLEAR OPTIMIZADA - Usar cliente centralizado
      const { createNuclearClient } = await import('@/utils/nuclear-client')
      const loadClient = await createNuclearClient()
      
      if (!loadClient) {
        setError('No se pudo crear cliente nuclear para categorías')
        setIsLoading(false)
        return
      }

      // 🚀 Construir función helper para aplicar filtros
      const applyFilters = (query: ReturnType<typeof loadClient['from']>) => {
        // Aplicar filtros de estado con AND/OR correctos
        if (selectedFilters.length > 0) {
          const orConditions: string[] = []
          
          if (selectedFilters.includes('Activos')) {
            orConditions.push('is_active.eq.true')
          }
          if (selectedFilters.includes('Inactivos')) {
            orConditions.push('is_active.eq.false')
          }
          
          // Solo aplicar condiciones OR si hay alguna
          if (orConditions.length > 0) {
            query = query.or(orConditions.join(','))
          }
        }

        // Filtrar por búsqueda (OR entre campos) - Solo si hay término de búsqueda
        if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
          const searchTerm = debouncedSearchTerm.trim()
          // Escapar caracteres especiales para SQL LIKE
          const escapedTerm = searchTerm.replace(/[%_\\]/g, '\\$&')
          query = query.or(`name.ilike.%${escapedTerm}%`)
        }

        return query
      }

      // 🚀 STEP 1: Obtener el total count (sin joins para mejor rendimiento)
      let countQuery = loadClient.from('bodegon_categories').select('id', { count: 'exact', head: true })
      countQuery = applyFilters(countQuery)
      
      const { count, error: countError } = await countQuery
      
      if (countError) {
        console.error('Error getting count:', countError)
        throw new Error(`Error en conteo: ${countError.message}`)
      }
      
      setTotalCount(count || 0)

      // 🚀 STEP 2: Obtener categorías paginadas con joins para conteo de productos
      const startIndex = (currentPage - 1) * pageSize
      const endIndex = startIndex + pageSize - 1

      let paginatedQuery = loadClient
        .from('bodegon_categories')
        .select(`
          *
        `)

      // Aplicar los mismos filtros
      paginatedQuery = applyFilters(paginatedQuery)

      // 🚀 Aplicar paginación y ordenamiento
      paginatedQuery = paginatedQuery
        .order('created_date', { ascending: false })
        .range(startIndex, endIndex)
      
      const { data: categoriesData, error: serviceError } = await paginatedQuery
      
      if (serviceError) {
        console.error('Error loading categories:', serviceError)
        throw new Error(`Error al cargar categorías: ${serviceError.message}`)
      }

      if (!categoriesData) {
        setCategories([])
        return
      }

      // Obtener conteo de productos para cada categoría
      const transformedData: CategoryWithDetails[] = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const { count, error: countError } = await loadClient
              .from('bodegon_products')
              .select('*', { count: 'exact', head: true })
              .eq('category_id', category.id)

            if (countError) {
              console.error('Error counting products for category:', category.id, countError)
              return { ...category, product_count: 0 }
            }

            return { ...category, product_count: count || 0 }
          } catch (err) {
            console.error('Error in product count for category:', category.id, err)
            return { ...category, product_count: 0 }
          }
        })
      )

      setCategories(transformedData)
      
    } catch (err) {
      console.error('Full error in loadCategories:', err)
      
      let errorMessage = 'Error inesperado al cargar categorías'
      
      if (err instanceof Error) {
        if (err.message.includes('Request timeout') || err.message.includes('timeout')) {
          errorMessage = 'La consulta tardó demasiado tiempo. Intenta de nuevo.'
        } else if (err.message.includes('Error al cargar categorías:') || err.message.includes('Error en conteo:')) {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
      setCategories([])
      setTotalCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    
    try {
      setDeletingId(categoryToDelete.id)

      // ✅ SOLUCIÓN NUCLEAR V2.0 - Usar utilities optimizadas
      const { nuclearDelete } = await import('@/utils/nuclear-client')

      // Hard delete - actually delete the category
      const { error: categoryError } = await nuclearDelete('bodegon_categories', categoryToDelete.id)

      if (categoryError) {
        toast.error('Error al eliminar categoría: ' + categoryError)
        setDeletingId(null)
        return
      }

      // Operación completada exitosamente
      toast.success('Categoría eliminada exitosamente')
      loadCategories() // Reload the categories list
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Error inesperado al eliminar la categoría')
    } finally {
      setDeletingId(null)
    }
  }

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview('')
  }

  // Handle edit click
  const handleEditClick = (category: Category) => {
    setCategoryToEdit(category)
    setFormData({
      name: category.name,
      is_active: category.is_active
    })
    // Set existing image if available
    if (category.image) {
      setImagePreview(category.image)
      setSelectedImage(null) // No new file selected initially
    } else {
      setImagePreview('')
      setSelectedImage(null)
    }
    setShowEditCategoryModal(true)
  }

  // Handle form submission for adding
  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    if (!user?.auth_user.id) {
      toast.error('Usuario no autenticado')
      return
    }

    setIsSubmitting(true)

    try {
      // ✅ SOLUCIÓN NUCLEAR V2.0 - Usar utilities optimizadas
      const { nuclearInsert } = await import('@/utils/nuclear-client')
      
      let imageUrl = null
      
      // TODO: En una implementación real, subir la imagen a S3 o storage
      if (selectedImage) {
        // Por ahora usar base64, en producción implementar upload real
        imageUrl = imagePreview
      }

      const categoryData = {
        name: formData.name.trim(),
        is_active: formData.is_active,
        image: imageUrl,
        created_by: user.auth_user.id,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString()
      }

      const result = await nuclearInsert('bodegon_categories', categoryData, '*')

      if (result.error) {
        toast.error('Error al crear la categoría: ' + result.error)
        return
      }

      toast.success('Categoría creada exitosamente')
      
      // Reset form and close modal
      resetForm()
      setShowAddCategoryModal(false)
      
      // Refresh categories list
      loadCategories()

    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Error inesperado al crear la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle form submission for editing
  const handleEditCategory = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    if (!categoryToEdit) {
      toast.error('No se encontró la categoría a editar')
      return
    }

    setIsSubmitting(true)

    try {
      // ✅ SOLUCIÓN NUCLEAR V2.0 - Usar utilities optimizadas
      const { nuclearUpdate } = await import('@/utils/nuclear-client')
      
      let imageUrl = categoryToEdit.image // Keep existing image by default
      
      // TODO: En una implementación real, subir la imagen a S3 o storage
      if (selectedImage) {
        // New image selected - use base64, en producción implementar upload real
        imageUrl = imagePreview
      } else if (!imagePreview) {
        // Image was removed
        imageUrl = null
      }

      const updateData = {
        name: formData.name.trim(),
        is_active: formData.is_active,
        image: imageUrl,
        modified_date: new Date().toISOString()
      }

      const result = await nuclearUpdate('bodegon_categories', categoryToEdit.id, updateData, '*')

      if (result.error) {
        toast.error('Error al actualizar la categoría: ' + result.error)
        return
      }

      toast.success('Categoría actualizada exitosamente')
      
      // Reset form and close modal
      resetForm()
      setShowEditCategoryModal(false)
      setCategoryToEdit(null)
      
      // Refresh categories list
      loadCategories()

    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Error inesperado al actualizar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form helper
  const resetForm = () => {
    setFormData({ name: '', is_active: true })
    setSelectedImage(null)
    setImagePreview('')
  }

  // Handle modal close for add
  const handleCloseAddModal = () => {
    resetForm()
    setShowAddCategoryModal(false)
  }

  // Handle modal close for edit
  const handleCloseEditModal = () => {
    resetForm()
    setShowEditCategoryModal(false)
    setCategoryToEdit(null)
  }

  // Load categories when session is ready
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      if (!isMounted) return
      
      try {
        await loadCategories({ current: isMounted })
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Load categories when filters change (including currentPage for server-side pagination)
  useEffect(() => {
    let isMounted = true // ✅ Flag para prevenir setState en componentes desmontados

    const loadData = async () => {
      if (!isMounted) return
      
      try {
        await loadCategories({ current: isMounted })
      } catch (error) {
        if (isMounted) {
          setError('Error al cargar categorías')
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
  }, [selectedFilters, debouncedSearchTerm, currentPage, pageSize]) // ✅ Usar debouncedSearchTerm

  // ✅ DEBOUNCE para búsqueda - evitar consultas excesivas
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Resetear a página 1 cuando hay nueva búsqueda
    }, 500) // 500ms de delay

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ✅ SERVER-SIDE PAGINATION: Las categorías ya vienen paginadas del servidor
  const paginatedCategories = categories // Las categorías ya están paginadas

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize))
    setCurrentPage(1)
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Categorías de Bodegón</h1>
          {error && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertCircleIcon className="w-4 h-4" />
              <span>{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadCategories()}
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
              <DropdownMenuItem>Exportar seleccionadas</DropdownMenuItem>
              <DropdownMenuItem>Eliminar seleccionadas</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            size="sm" 
            className="whitespace-nowrap h-10 md:h-8 text-base md:text-sm"
            onClick={() => setShowAddCategoryModal(true)}
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
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filterOptions.map((option) => (
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
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-10 h-10 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              // Fallback si la imagen falla al cargar
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center ${
                            category.image ? 'hidden' : ''
                          }`}
                          style={{ display: category.image ? 'none' : 'flex' }}
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
                            className="text-red-600 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDeleteClick(category)
                            }}
                            disabled={deletingId === category.id}
                          >
                            {deletingId === category.id ? 'Eliminando...' : 'Eliminar'}
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
                    
                    {/* Números de página - Lógica simplificada */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = []
                        const maxVisiblePages = isMobile ? 5 : 7
                        
                        if (totalPages <= maxVisiblePages) {
                          // Mostrar todas las páginas si son pocas
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
                          // Primera página
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
                          
                          // Puntos suspensivos iniciales
                          if (startPage > 2) {
                            pages.push(<span key="dots1" className="px-1 text-gray-400 text-xs">...</span>)
                          }
                          
                          // Páginas intermedias
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
                          
                          // Puntos suspensivos finales
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="dots2" className="px-1 text-gray-400 text-xs">...</span>)
                          }
                          
                          // Última página
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
              {/* Nombre */}
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

              {/* Estado */}
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

              {/* Foto de portada */}
              <div className="space-y-2">
                <Label>Foto de portada</Label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG o WebP (máx. 5MB)</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('categoryImage')?.click()}
                      disabled={isSubmitting}
                      className="h-9 text-sm"
                    >
                      Seleccionar imagen
                    </Button>
                    <input
                      id="categoryImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                )}
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
                disabled={isSubmitting || !formData.name.trim()}
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
              {/* Nombre */}
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

              {/* Estado */}
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

              {/* Foto de portada */}
              <div className="space-y-2">
                <Label>Foto de portada</Label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG o WebP (máx. 5MB)</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('drawerCategoryImage')?.click()}
                      disabled={isSubmitting}
                      className="h-10 text-base"
                    >
                      Seleccionar imagen
                    </Button>
                    <input
                      id="drawerCategoryImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={handleAddCategory}
                disabled={isSubmitting || !formData.name.trim()}
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
                Modifica la información de la categoría seleccionada.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Nombre */}
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

              {/* Estado */}
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

              {/* Foto de portada */}
              <div className="space-y-2">
                <Label>Foto de portada</Label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG o WebP (máx. 5MB)</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('editCategoryImage')?.click()}
                      disabled={isSubmitting}
                      className="h-9 text-sm"
                    >
                      Seleccionar imagen
                    </Button>
                    <input
                      id="editCategoryImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                )}
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
                disabled={isSubmitting || !formData.name.trim()}
                className="h-11 md:h-10 text-base md:text-sm"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Categoría'}
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
                Modifica la información de la categoría seleccionada.
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 space-y-4 pb-4">
              {/* Nombre */}
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

              {/* Estado */}
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

              {/* Foto de portada */}
              <div className="space-y-2">
                <Label>Foto de portada</Label>
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Arrastra una imagen aquí</p>
                    <p className="text-xs text-gray-500 mb-4">PNG, JPG o WebP (máx. 5MB)</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('drawerEditCategoryImage')?.click()}
                      disabled={isSubmitting}
                      className="h-10 text-base"
                    >
                      Seleccionar imagen
                    </Button>
                    <input
                      id="drawerEditCategoryImage"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={isSubmitting}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Vista previa"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isSubmitting}
                    >
                      <XIcon className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DrawerFooter>
              <Button
                onClick={handleEditCategory}
                disabled={isSubmitting || !formData.name.trim()}
                className="h-11 text-base"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Categoría'}
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

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        itemName={categoryToDelete?.name || ""}
        itemType="categoría"
        onConfirm={handleDeleteConfirm}
        isLoading={deletingId !== null}
        requireNameConfirmation={true}
      />
    </div>
  )
}