'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeftIcon, PlusIcon, UploadIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { executeNuclearQuery } from '@/utils/nuclear-client'

interface RestaurantProduct {
  id: string
  name: string
  description: string | null
  image_gallery_urls: string[] | null
  price: number
  restaurant_id: string | null
  category_id: string | null
  subcategory_id: string | null
  is_available: boolean | null
  created_by: string | null
  created_at: string
  modified_at: string
  is_promo: boolean | null
  is_discount: boolean | null
  discounted_price: number | null
}

interface Category {
  id: string
  name: string
  restaurant_id: string | null
}

interface Subcategory {
  id: string
  name: string
  parent_category: string
  restaurant_id: string | null
}

interface Restaurant {
  id: string
  name: string
}

interface RestaurantProductWithDetails extends RestaurantProduct {
  category_name?: string
  subcategory_name?: string
  restaurant_name?: string
}

interface AgregarProductoRestauranteViewProps {
  onBack: () => void
  onViewChange: (view: string) => void
  productToEdit?: RestaurantProductWithDetails | null
}

export function AgregarProductoRestauranteView({ onBack, onViewChange, productToEdit }: AgregarProductoRestauranteViewProps) {
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    restaurant_id: '',
    category_id: '',
    subcategory_id: '',
    is_available: true,
    is_discount: false,
    is_promo: false,
    discounted_price: ''
  })

  // Data states
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [images, setImages] = useState<File[]>([])
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newSubcategoryName, setNewSubcategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [subcategoryPopoverOpen, setSubcategoryPopoverOpen] = useState(false)
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false)

  const { user } = useAuth()

  // Load restaurants, categories - Nuclear Client V2.0
  const loadInitialData = async () => {
    try {
      // Load restaurants using Nuclear Client V2.0
      const restaurantsResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurants')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      }, false)

      if (restaurantsResult.error) {
        toast.error('Error al cargar restaurantes: ' + restaurantsResult.error)
        return
      }

      if (restaurantsResult.data) {
        setRestaurants(restaurantsResult.data as Restaurant[])
      }

    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Error inesperado al cargar datos')
    }
  }

  // Load categories by restaurant - Nuclear Client V2.0
  const loadCategories = async (restaurantId: string) => {
    if (!restaurantId) return

    try {
      const categoriesResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_categories')
          .select('id, name, restaurant_id')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('name')
      }, false)

      if (categoriesResult.error) {
        toast.error('Error al cargar categorías: ' + categoriesResult.error)
        return
      }

      if (categoriesResult.data) {
        setCategories(categoriesResult.data as Category[])
      }

    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error inesperado al cargar categorías')
    }
  }

  // Load subcategories when category changes - Nuclear Client V2.0
  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId) return

    setIsLoadingSubcategories(true)
    try {
      const result = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_subcategories')
          .select('id, name, parent_category, restaurant_id')
          .eq('parent_category', categoryId)
          .eq('is_active', true)
          .order('name')
      }, false)

      if (result.error) {
        toast.error('Error al cargar subcategorías: ' + result.error)
        return
      }

      if (result.data) {
        setSubcategories(result.data as Subcategory[])
      }

    } catch (error) {
      console.error('Error loading subcategories:', error)
      toast.error('Error inesperado al cargar subcategorías')
    } finally {
      setIsLoadingSubcategories(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Pre-populate form when editing - Wait for restaurants to load first
  useEffect(() => {
    if (productToEdit && restaurants.length > 0) {
      console.log('📝 Editando producto:', productToEdit.name, 'Restaurant ID:', productToEdit.restaurant_id)
      console.log('🏪 Restaurantes disponibles:', restaurants.map(r => ({ id: r.id, name: r.name })))
      setFormData({
        name: productToEdit.name || '',
        description: productToEdit.description || '',
        price: productToEdit.price?.toString() || '',
        restaurant_id: productToEdit.restaurant_id || '',
        category_id: productToEdit.category_id || '',
        subcategory_id: productToEdit.subcategory_id || '',
        is_available: productToEdit.is_available ?? true,
        is_discount: productToEdit.is_discount ?? false,
        is_promo: productToEdit.is_promo ?? false,
        discounted_price: productToEdit.discounted_price?.toString() || ''
      })
      
      // Load existing images
      if (productToEdit.image_gallery_urls && productToEdit.image_gallery_urls.length > 0) {
        setImages([])
        setExistingImageUrls(productToEdit.image_gallery_urls)
      } else {
        setExistingImageUrls([])
      }
      
      // Load categories if restaurant is selected
      if (productToEdit.restaurant_id) {
        loadCategories(productToEdit.restaurant_id)
      }
      
      // Load subcategories if category is selected
      if (productToEdit.category_id) {
        loadSubcategories(productToEdit.category_id)
      }
    } else if (!productToEdit) {
      // Clear existing images when not editing
      setExistingImageUrls([])
    }
  }, [productToEdit?.id, restaurants.length])

  const handleInputChange = (field: string, value: string) => {
    // Ignore special placeholder values
    if (value === 'loading' || value === 'no-data') {
      return
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Load categories when restaurant changes
    if (field === 'restaurant_id' && value) {
      loadCategories(value)
      setFormData(prev => ({ ...prev, category_id: '', subcategory_id: '' }))
      setCategories([])
      setSubcategories([])
    }

    // Load subcategories when category changes
    if (field === 'category_id' && value) {
      setSubcategories([]) // Clear previous subcategories
      loadSubcategories(value)
      setFormData(prev => ({ ...prev, subcategory_id: '' }))
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).slice(0, 5) // Max 5 images
      setImages(prev => [...prev, ...newImages].slice(0, 5))
    }
  }

  const handleCancel = () => {
    // Reset form state
    setFormData({
      name: '',
      description: '',
      price: '',
      restaurant_id: '',
      category_id: '',
      subcategory_id: '',
      is_available: true,
      is_discount: false,
      is_promo: false,
      discounted_price: ''
    })
    setImages([])
    setExistingImageUrls([])
    onBack()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    // Basic validation
    if (!formData.name.trim()) {
      toast.error('El nombre del producto es requerido')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    if (!formData.restaurant_id) {
      toast.error('Debe seleccionar un restaurante')
      return
    }

    if (!user?.auth_user.id) {
      toast.error('Usuario no autenticado')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload new images first if any
      let newImageUrls: string[] = []
      if (images.length > 0) {
        // Convert files to base64 URLs for now
        // TODO: In a real implementation, you'd upload to S3 or similar
        newImageUrls = await Promise.all(
          images.map(async (file) => {
            return new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve(reader.result as string)
              reader.readAsDataURL(file)
            })
          })
        )
      }

      // Combine existing images with new images
      const allImageUrls = [...existingImageUrls, ...newImageUrls]

      // Prepare product data
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        image_gallery_urls: allImageUrls.length > 0 ? allImageUrls : [],
        price: parseFloat(formData.price),
        restaurant_id: formData.restaurant_id || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        is_available: formData.is_available,
        is_discount: formData.is_discount,
        is_promo: formData.is_promo,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        ...(productToEdit 
          ? { modified_at: new Date().toISOString() } 
          : { 
              created_by: user.auth_user.id,
              created_at: new Date().toISOString(),
              modified_at: new Date().toISOString()
            }
        )
      }

      console.log('🔍 Product data to insert/update:', productData)

      if (productToEdit) {
        // Update existing product
        const updateResult = await executeNuclearQuery(async (client) => {
          return await client
            .from('restaurant_products')
            .update(productData)
            .eq('id', productToEdit.id)
            .select('*')
        }, false)
        
        if (updateResult.error) {
          toast.error('Error al actualizar el producto: ' + updateResult.error)
          setIsSubmitting(false)
          return
        }

        toast.success('Producto actualizado exitosamente')
      } else {
        // Insert new product
        const insertResult = await executeNuclearQuery(async (client) => {
          return await client
            .from('restaurant_products')
            .insert(productData)
            .select('*')
        }, false)
        
        if (insertResult.error) {
          toast.error('Error al crear el producto: ' + insertResult.error)
          setIsSubmitting(false)
          return
        }

        toast.success('Producto agregado exitosamente')
      }
      
      // Reset form only when creating new product
      if (!productToEdit) {
        setFormData({
          name: '',
          description: '',
          price: '',
          restaurant_id: '',
          category_id: '',
          subcategory_id: '',
          is_available: true,
          is_discount: false,
          is_promo: false,
          discounted_price: ''
        })
        setImages([])
        setExistingImageUrls([])
      }
      
      // Navigate back
      onBack()
    } catch (error) {
      console.error(productToEdit ? 'Error updating product:' : 'Error creating product:', error)
      toast.error(productToEdit ? 'Error inesperado al actualizar el producto' : 'Error inesperado al agregar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user?.auth_user.id || !formData.restaurant_id) return

    setIsCreatingCategory(true)
    try {
      const result = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_categories')
          .insert({
            name: newCategoryName.trim(),
            restaurant_id: formData.restaurant_id,
            is_active: true,
            created_by: user.auth_user.id,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString()
          })
          .select('*')
      }, false)

      if (result.error) {
        toast.error('Error al crear la categoría: ' + result.error)
        return
      }

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setCategories(prev => [...prev, result.data[0] as Category])
        setNewCategoryName('')
        setCategoryPopoverOpen(false)
        toast.success('Categoría creada exitosamente')
      }

    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Error inesperado al crear la categoría')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleCreateSubcategory = async () => {
    if (!newSubcategoryName.trim() || !user?.auth_user.id || !formData.category_id || !formData.restaurant_id) return

    setIsCreatingSubcategory(true)
    try {
      const result = await executeNuclearQuery(async (client) => {
        return await client
          .from('restaurant_subcategories')
          .insert({
            name: newSubcategoryName.trim(),
            parent_category: formData.category_id,
            restaurant_id: formData.restaurant_id,
            is_active: true,
            created_by: user.auth_user.id,
            created_at: new Date().toISOString(),
            modified_at: new Date().toISOString()
          })
          .select('*')
      }, false)

      if (result.error) {
        toast.error('Error al crear la subcategoría: ' + result.error)
        return
      }

      if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        setSubcategories(prev => [...prev, result.data[0] as Subcategory])
        setNewSubcategoryName('')
        setSubcategoryPopoverOpen(false)
        toast.success('Subcategoría creada exitosamente')
      }

    } catch (error) {
      console.error('Error creating subcategory:', error)
      toast.error('Error inesperado al crear la subcategoría')
    } finally {
      setIsCreatingSubcategory(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-10 md:h-8">
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{productToEdit ? 'Editar Producto de Restaurante' : 'Agregar Producto de Restaurante'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Detalles del Producto */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Producto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Pizza Margarita"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-10 md:h-9 text-base md:text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del producto de restaurante"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="min-h-20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Imágenes del Producto */}
          <Card>
            <CardHeader>
              <CardTitle>Imágenes del Producto</CardTitle>
            </CardHeader>
            <CardContent>
              {images.length === 0 && existingImageUrls.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <UploadIcon className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-2">Sueltas tus imágenes aquí</p>
                  <p className="text-sm text-gray-500 mb-4">PNG, JPG o WebP (max. 5MB)</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 md:h-8 text-base md:text-sm"
                    onClick={() => document.getElementById('imageUpload')?.click()}
                  >
                    Seleccionar imágenes
                  </Button>
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Imágenes existentes */}
                  {existingImageUrls.map((imageUrl, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square">
                      <img
                        src={imageUrl}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        onClick={() => setExistingImageUrls(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                        Existente
                      </div>
                    </div>
                  ))}
                  
                  {/* Imágenes nuevas cargadas */}
                  {images.map((image, index) => (
                    <div key={`new-${index}`} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                        onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                        Nueva
                      </div>
                    </div>
                  ))}
                  
                  {/* Placeholders para más imágenes */}
                  {Array.from({ length: Math.max(0, 4 - images.length - existingImageUrls.length) }).map((_, index) => (
                    <div 
                      key={`placeholder-${index}`} 
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                      onClick={() => document.getElementById('imageUpload')?.click()}
                    >
                      <UploadIcon className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 text-center px-2">
                        Agregar imagen
                      </span>
                    </div>
                  ))}
                  
                  <input
                    id="imageUpload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Restaurante y Categorías */}
          <Card>
            <CardHeader>
              <CardTitle>Restaurante y Categorías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Seleccionar restaurante *</Label>
                <Select value={formData.restaurant_id} onValueChange={(value) => handleInputChange('restaurant_id', value)}>
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <SelectValue placeholder="Seleccionar un restaurante" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {restaurants.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.restaurant_id && (
                <div className="space-y-2">
                  <Label>Seleccionar una categoría</Label>
                  <div className="flex items-center gap-2">
                    <Select value={formData.category_id} onValueChange={(value) => handleInputChange('category_id', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                        <SelectValue placeholder="Seleccionar una categoría" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-10 md:h-9 px-3">
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none">Nueva Categoría</h4>
                          <div className="space-y-2">
                            <Label htmlFor="category-name">Nombre</Label>
                            <Input
                              id="category-name"
                              placeholder="Nombre de la categoría"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewCategoryName('')
                                setCategoryPopoverOpen(false)
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!newCategoryName.trim() || isCreatingCategory || !formData.restaurant_id}
                              onClick={handleCreateCategory}
                            >
                              {isCreatingCategory ? 'Creando...' : 'Crear'}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {formData.category_id && (
                <div className="space-y-2">
                  <Label>Seleccionar una subcategoría</Label>
                  <div className="flex items-center gap-2">
                    <Select value={formData.subcategory_id} onValueChange={(value) => handleInputChange('subcategory_id', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                        <SelectValue placeholder={
                          isLoadingSubcategories 
                            ? "Cargando subcategorías..." 
                            : subcategories.length === 0 
                              ? "No hay subcategorías disponibles"
                              : "Seleccionar subcategoría"
                        } />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {isLoadingSubcategories ? (
                          <SelectItem value="loading" disabled>
                            Cargando subcategorías...
                          </SelectItem>
                        ) : subcategories.length === 0 ? (
                          <SelectItem value="no-data" disabled>
                            No hay subcategorías disponibles
                          </SelectItem>
                        ) : (
                          subcategories.map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id}>
                              {subcategory.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Popover open={subcategoryPopoverOpen} onOpenChange={setSubcategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="h-10 md:h-9 px-3"
                          disabled={isLoadingSubcategories}
                        >
                          <PlusIcon className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <h4 className="font-medium leading-none">Nueva Subcategoría</h4>
                          <div className="space-y-2">
                            <Label htmlFor="subcategory-name">Nombre</Label>
                            <Input
                              id="subcategory-name"
                              placeholder="Nombre de la subcategoría"
                              value={newSubcategoryName}
                              onChange={(e) => setNewSubcategoryName(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewSubcategoryName('')
                                setSubcategoryPopoverOpen(false)
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              disabled={!newSubcategoryName.trim() || isCreatingSubcategory || !formData.category_id}
                              onClick={handleCreateSubcategory}
                            >
                              {isCreatingSubcategory ? 'Creando...' : 'Crear'}
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Precio y Estado */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Precio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio *</Label>
                  <div className="flex">
                    <div className="flex items-center justify-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                      <span className="text-sm text-gray-600">USD</span>
                    </div>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="rounded-l-none h-10 md:h-9 text-base md:text-sm"
                      required
                    />
                  </div>
                </div>

                {formData.is_discount && (
                  <div className="space-y-2">
                    <Label htmlFor="discounted_price">Precio con descuento</Label>
                    <div className="flex">
                      <div className="flex items-center justify-center px-3 bg-gray-100 border border-r-0 rounded-l-md">
                        <span className="text-sm text-gray-600">USD</span>
                      </div>
                      <Input
                        id="discounted_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.discounted_price || ''}
                        onChange={(e) => handleInputChange('discounted_price', e.target.value)}
                        className="rounded-l-none h-10 md:h-9 text-base md:text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="is_discount" className="text-sm font-medium">
                  Producto en descuento
                </label>
                <Switch
                  id="is_discount"
                  checked={formData.is_discount}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_discount: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="is_promo" className="text-sm font-medium">
                  Producto en promoción
                </label>
                <Switch
                  id="is_promo"
                  checked={formData.is_promo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_promo: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Select value={formData.is_available ? "available" : "unavailable"} onValueChange={(value) => setFormData(prev => ({ ...prev, is_available: value === 'available' }))}>
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.is_available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <SelectValue>
                        {formData.is_available ? 'Disponible' : 'No disponible'}
                      </SelectValue>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Disponible
                      </div>
                    </SelectItem>
                    <SelectItem value="unavailable">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        No disponible
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Establece la disponibilidad del producto.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* Fixed Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-10">
        <div className="flex justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            className="h-11 md:h-10 text-base md:text-sm"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="h-11 md:h-10 text-base md:text-sm"
            onClick={handleSubmit}
          >
            {isSubmitting ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Agregar Producto')}
          </Button>
        </div>
      </div>
    </div>
  )
}