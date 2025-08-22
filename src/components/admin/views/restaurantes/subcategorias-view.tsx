'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { ImageIcon, PackageIcon, TagIcon, UploadIcon, UploadCloudIcon, XIcon, CheckIcon } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { DeleteConfirmationModal } from '@/components/admin/modals/delete-confirmation-modal'
import { 
  RestaurantSubcategoryService, 
  RestaurantSubcategoryWithDetails 
} from '@/services/restaurant-subcategories'
import { RestaurantSubcategory } from '@/types/restaurants'
import { TableTemplate, TableColumn, FilterOption } from '@/components/admin/templates/table-template'

export function RestaurantesSubcatView() {
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [subcategories, setSubcategories] = useState<RestaurantSubcategoryWithDetails[]>([])
  const [error, setError] = useState<string>('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<RestaurantSubcategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<RestaurantSubcategory | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<{id: string, name: string, restaurant_id: string | null}[]>([])
  const [formData, setFormData] = useState({
    name: '',
    parent_category: '',
    is_active: true
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')

  const { user } = useAuth()

  const statusFilters: FilterOption[] = [
    { label: 'Activos', value: 'Activos', color: 'bg-green-500' },
    { label: 'Inactivos', value: 'Inactivos', color: 'bg-gray-500' }
  ]

  const loadCategories = useCallback(async () => {
    try {
      const { executeNuclearQuery } = await import('@/utils/nuclear-client')
      
      const { data, error } = await executeNuclearQuery(
        async (client) => {
          return await client
            .from('restaurant_categories')
            .select('id, name, restaurant_id')
            .eq('is_active', true)
            .order('name', { ascending: true })
        },
        false
      )
      
      if (error) {
        console.error('Error al cargar categorías:', error)
        return
      }
      
      setCategories(data || [])
    } catch (error) {
      console.error('Error inesperado al cargar categorías:', error)
    }
  }, [])

  const loadSubcategories = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const { data, error } = await RestaurantSubcategoryService.getAll()
      
      if (error || !data) {
        setError('Error al cargar subcategorías')
        toast.error('Error al cargar subcategorías')
        return
      }
      
      setSubcategories(data)
    } catch (error) {
      setError('Error inesperado al cargar subcategorías')
      toast.error('Error inesperado al cargar subcategorías')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load data on mount and when filters change
  useEffect(() => {
    loadCategories()
    loadSubcategories()
  }, [])

  // Filter and search logic
  const filteredSubcategories = subcategories.filter(subcategory => {
    // Apply status filters
    if (selectedStatusFilters.length > 0 && selectedStatusFilters.length < 2) {
      const isActive = selectedStatusFilters.includes('Activos')
      if (subcategory.is_active !== isActive) return false
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return subcategory.name.toLowerCase().includes(searchLower) ||
             (subcategory.category?.name?.toLowerCase().includes(searchLower))
    }

    return true
  })

  const handleDeleteClick = (subcategory: RestaurantSubcategory) => {
    setSubcategoryToDelete(subcategory)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!subcategoryToDelete) return

    try {
      setIsDeleting(true)
      
      // Check if subcategory has products
      const subcategoryWithDetails = subcategories.find(sub => sub.id === subcategoryToDelete.id) as RestaurantSubcategoryWithDetails
      
      console.log('🔍 Subcategory details:', subcategoryWithDetails)
      console.log('🔢 Product count:', subcategoryWithDetails?.product_count)
      
      if (subcategoryWithDetails?.product_count && subcategoryWithDetails.product_count > 0) {
        toast.error(`No se puede eliminar la subcategoría "${subcategoryToDelete.name}" porque tiene ${subcategoryWithDetails.product_count} producto(s) asociado(s). Elimina o reasigna los productos primero.`)
        return
      }

      const { error } = await RestaurantSubcategoryService.delete(subcategoryToDelete.id)
      
      if (error) {
        toast.error('Error al eliminar subcategoría')
        return
      }

      toast.success('Subcategoría eliminada exitosamente')
      await loadSubcategories()
      setShowDeleteModal(false)
      setSubcategoryToDelete(null)
    } catch (error) {
      toast.error('Error inesperado al eliminar subcategoría')
    } finally {
      setIsDeleting(false)
    }
  }

  // Add/Edit handlers
  const handleAddClick = () => {
    setFormData({
      name: '',
      parent_category: '',
      is_active: true
    })
    setImageFile(null)
    setImagePreview('')
    setEditingSubcategory(null)
    setShowAddModal(true)
  }

  const handleEditClick = (subcategory: RestaurantSubcategory) => {
    setFormData({
      name: subcategory.name,
      parent_category: subcategory.parent_category,
      is_active: subcategory.is_active
    })
    setImageFile(null)
    setImagePreview(subcategory.image || '')
    setEditingSubcategory(subcategory)
    setShowEditModal(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.parent_category) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    if (!user?.auth_user?.id) {
      toast.error('Usuario no autenticado')
      return
    }

    try {
      setIsSubmitting(true)
      let imageUrl = imagePreview

      // Upload image if selected
      if (imageFile) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          imageUrl = await S3StorageService.uploadRestaurantSubcategoryImage(
            imageFile,
            editingSubcategory?.id
          )
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError)
          toast.error('Error al subir la imagen')
          return
        }
      }

      if (editingSubcategory) {
        // Edit existing subcategory
        const updateData = {
          name: formData.name.trim(),
          parent_category: formData.parent_category,
          is_active: formData.is_active,
          modified_at: new Date().toISOString(),
          image: imageUrl || undefined
        }
        
        const { error } = await RestaurantSubcategoryService.update(
          editingSubcategory.id,
          updateData
        )
        
        if (error) {
          console.error('Error updating subcategory:', error)
          toast.error('Error al actualizar subcategoría')
          return
        }
        
        toast.success('Subcategoría actualizada exitosamente')
      } else {
        // Get restaurant_id from parent category
        const selectedCategory = categories.find(cat => cat.id === formData.parent_category)
        const restaurantId = selectedCategory?.restaurant_id || null
        
        // Create new subcategory
        const createData = {
          name: formData.name.trim(),
          parent_category: formData.parent_category,
          restaurant_id: restaurantId,
          is_active: true,
          created_by: user?.auth_user?.id || '',
          created_at: new Date().toISOString(),
          modified_at: new Date().toISOString(),
          image: imageUrl || undefined
        }
        
        const { error } = await RestaurantSubcategoryService.create(createData)
        
        if (error) {
          console.error('Error creating subcategory:', error)
          toast.error('Error al crear subcategoría')
          return
        }
        
        toast.success('Subcategoría creada exitosamente')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      await loadSubcategories()
    } catch (error) {
      toast.error('Error inesperado al guardar subcategoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Table columns configuration
  const columns: TableColumn<RestaurantSubcategoryWithDetails>[] = [
    {
      key: 'name',
      label: 'Nombre',
      render: (subcategory) => (
        <div className="flex items-center gap-3">
          {subcategory.image ? (
            <img 
              src={subcategory.image} 
              alt={subcategory.name}
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
              subcategory.image ? 'hidden' : ''
            }`}
            style={{ display: subcategory.image ? 'none' : 'flex' }}
          >
            <ImageIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-medium text-sm">{subcategory.name}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría Padre',
      render: (subcategory) => (
        <span className="text-sm text-gray-600">{subcategory.category?.name || 'Sin categoría'}</span>
      )
    },
    {
      key: 'product_count',
      label: 'Productos',
      render: (subcategory) => (
        <div className="flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600">
            {subcategory.product_count || 0}
          </span>
        </div>
      )
    },
    {
      key: 'is_active',
      label: 'Estado',
      render: (subcategory) => (
        <Badge 
          variant={subcategory.is_active ? "default" : "secondary"} 
          className={subcategory.is_active 
            ? "bg-green-100 text-green-700 border-green-200" 
            : "bg-gray-100 text-gray-700 border-gray-200"}
        >
          {subcategory.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    }
  ]

  return (
    <>
      <TableTemplate
        title="Subcategorías de Restaurantes"
        data={filteredSubcategories}
        columns={columns}
        isLoading={isLoading}
        error={error}
        
        onReload={loadSubcategories}
        
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar subcategorías..."
        
        statusFilters={statusFilters}
        selectedStatusFilters={selectedStatusFilters}
        onStatusFiltersChange={setSelectedStatusFilters}
        
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        
        emptyStateIcon={<TagIcon className="w-8 h-8 text-gray-400" />}
        emptyStateTitle="No se encontraron subcategorías"
        
        onAdd={handleAddClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        
        isMobile={isMobile}
      />

      {/* Add Modal */}
      {isMobile ? (
        <Drawer open={showAddModal} onOpenChange={setShowAddModal}>
          <DrawerContent className="bg-[#F9FAFC] rounded-t-[20px] max-h-[85vh]">
            <DrawerHeader className="text-left border-b">
              <DrawerTitle>Agregar Subcategoría</DrawerTitle>
              <DrawerDescription>
                Completa la información de la nueva subcategoría
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre de la subcategoría"
                    className="h-11 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="parent_category">Categoría Padre *</Label>
                  <Select
                    value={formData.parent_category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category: value }))}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  {imagePreview ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {imageFile?.name || 'Imagen cargada'}
                        </p>
                        <p className="text-xs text-green-700">
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Imagen actual'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <UploadCloudIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Selecciona una imagen</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload-mobile-add"
                      />
                      <Label
                        htmlFor="image-upload-mobile-add"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <UploadIcon className="w-4 h-4" />
                        Subir Imagen
                      </Label>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DrawerFooter className="border-t">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-11 text-base"
              >
                {isSubmitting ? 'Creando...' : 'Crear Subcategoría'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 text-base">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Agregar Subcategoría</DialogTitle>
              <DialogDescription>
                Completa la información de la nueva subcategoría
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_desktop">Nombre *</Label>
                <Input
                  id="name_desktop"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la subcategoría"
                  className="h-10 md:h-9 text-base md:text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parent_category_desktop">Categoría Padre *</Label>
                <Select
                  value={formData.parent_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category: value }))}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Imagen</Label>
                {imagePreview ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {imageFile?.name || 'Imagen cargada'}
                      </p>
                      <p className="text-xs text-green-700">
                        {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Imagen actual'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Selecciona una imagen</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-desktop-add"
                    />
                    <Label
                      htmlFor="image-upload-desktop-add"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <UploadIcon className="w-4 h-4" />
                      Subir Imagen
                    </Label>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 text-sm"
              >
                {isSubmitting ? 'Creando...' : 'Crear Subcategoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Modal */}
      {isMobile ? (
        <Drawer open={showEditModal} onOpenChange={setShowEditModal}>
          <DrawerContent className="bg-[#F9FAFC] rounded-t-[20px] max-h-[85vh]">
            <DrawerHeader className="text-left border-b">
              <DrawerTitle>Editar Subcategoría</DrawerTitle>
              <DrawerDescription>
                Modifica la información de la subcategoría
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Nombre *</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nombre de la subcategoría"
                    className="h-11 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_parent_category">Categoría Padre *</Label>
                  <Select
                    value={formData.parent_category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category: value }))}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Imagen</Label>
                  {imagePreview ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {imageFile?.name || 'Imagen cargada'}
                        </p>
                        <p className="text-xs text-green-700">
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Imagen actual'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      >
                        <XIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <UploadCloudIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Selecciona una imagen</p>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload-mobile-edit"
                      />
                      <Label
                        htmlFor="image-upload-mobile-edit"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <UploadIcon className="w-4 h-4" />
                        Subir Imagen
                      </Label>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit_status_mobile">Estado</Label>
                  <Select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                  >
                    <SelectTrigger className="h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Activo
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                          Inactivo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DrawerFooter className="border-t">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-11 text-base"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Subcategoría'}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="h-11 text-base">
                  Cancelar
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Editar Subcategoría</DialogTitle>
              <DialogDescription>
                Modifica la información de la subcategoría
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name_desktop">Nombre *</Label>
                <Input
                  id="edit_name_desktop"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre de la subcategoría"
                  className="h-10 md:h-9 text-base md:text-sm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_parent_category_desktop">Categoría Padre *</Label>
                <Select
                  value={formData.parent_category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_category: value }))}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Imagen</Label>
                {imagePreview ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-900 truncate">
                        {imageFile?.name || 'Imagen cargada'}
                      </p>
                      <p className="text-xs text-green-700">
                        {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : 'Imagen actual'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <UploadCloudIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Selecciona una imagen</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload-desktop-edit"
                    />
                    <Label
                      htmlFor="image-upload-desktop-edit"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <UploadIcon className="w-4 h-4" />
                      Subir Imagen
                    </Label>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit_status_desktop">Estado</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}
                >
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Activo
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                        Inactivo
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-10 text-sm"
              >
                {isSubmitting ? 'Actualizando...' : 'Actualizar Subcategoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={subcategoryToDelete?.name || ''}
        itemType="subcategoría"
        isLoading={isDeleting}
        requireNameConfirmation={false}
      />
    </>
  )
}