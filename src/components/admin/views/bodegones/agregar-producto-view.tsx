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
import { nuclearSelect, nuclearInsert, nuclearUpdate, nuclearDelete, executeNuclearQuery } from '@/utils/nuclear-client'

interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  price: number
  is_active: boolean | null
  created_date: string
  image_gallery_urls: string[] | null
  bar_code: string | null
  category_id: string | null
  subcategory_id: string | null
  is_discount: boolean | null
  is_promo: boolean | null
  discounted_price: number | null
  created_by: string | null
  modified_date: string | null
}

interface Category {
  id: string
  name: string
}

interface Subcategory {
  id: string
  name: string
  parent_category: string
}

interface Bodegon {
  id: string
  name: string
}

interface BodegonProductWithDetails {
  id: string
  name: string
  sku?: string
  description?: string
  price: number
  is_active?: boolean
  created_date: string
  image_gallery_urls?: string[]
  bar_code?: string
  category_id?: string
  subcategory_id?: string
  is_discount?: boolean
  is_promo?: boolean
  discounted_price?: number
  created_by?: string
  modified_date?: string
  category_name?: string
  subcategory_name?: string
  inventory_count?: number
  available_at_bodegons?: string[]
}

interface AgregarProductoBodegonViewProps {
  onBack: () => void
  onViewChange: (view: string) => void
  productToEdit?: BodegonProductWithDetails | null
}

export function AgregarProductoBodegonView({ onBack, onViewChange, productToEdit }: AgregarProductoBodegonViewProps) {
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    bar_code: '',
    description: '',
    price: '',
    category_id: '',
    subcategory_id: '',
    is_active: true,
    is_discount: false,
    is_promo: false,
    discounted_price: ''
  })

  // Data states
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Category[]>([])
  const [bodegones, setBodegones] = useState<Bodegon[]>([])
  const [selectedBodegones, setSelectedBodegones] = useState<string[]>([])
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

  const { user } = useAuth()

  // Load categories - Nuclear Client V2.0
  const loadCategories = async () => {
    try {
      // Load categories using Nuclear Client V2.0
      const categoriesResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('bodegon_categories')
          .select('id, name')
          .order('name')
      }, false) // Don't show user error automatically

      // Load bodegones using Nuclear Client V2.0
      const bodegonesResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('bodegons')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
      }, false) // Don't show user error automatically

      if (categoriesResult.error) {
        toast.error('Error al cargar categorías: ' + categoriesResult.error)
        return
      }

      if (bodegonesResult.error) {
        toast.error('Error al cargar bodegones: ' + bodegonesResult.error)
        return
      }

      // Operations completed successfully
      if (categoriesResult.data) {
        setCategories(categoriesResult.data as Category[])
      }

      if (bodegonesResult.data) {
        setBodegones(bodegonesResult.data as Bodegon[])
      }

    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error inesperado al cargar datos')
    }
  }

  // Load subcategories when category changes - Nuclear Client V2.0
  const loadSubcategories = async (categoryId: string) => {
    if (!categoryId) return

    try {
      const result = await executeNuclearQuery(async (client) => {
        return await client
          .from('bodegon_subcategories')
          .select('id, name')
          .eq('parent_category', categoryId)
          .order('name')
      }, false) // Don't show user error automatically

      if (result.error) {
        toast.error('Error al cargar subcategorías: ' + result.error)
        return
      }

      // Operation completed successfully
      if (result.data) {
        setSubcategories(result.data as Subcategory[])
      }

    } catch (error) {
      console.error('Error loading subcategories:', error)
      toast.error('Error inesperado al cargar subcategorías')
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Load product bodegones when editing - Nuclear Client V2.0
  const loadProductBodegones = async (productId: string) => {
    try {
      const result = await executeNuclearQuery(async (client) => {
        return await client
          .from('bodegon_inventories')
          .select('bodegon_id')
          .eq('product_id', productId)
      }, false) // Don't show user error automatically

      if (result.error) {
        console.error('Error loading product bodegones:', result.error)
        return
      }

      // Operation completed successfully
      if (result.data) {
        const bodegonIds = (result.data as any[]).map((item: any) => item.bodegon_id)
        console.log('Loaded bodegones for product:', productId, bodegonIds)
        setSelectedBodegones(bodegonIds)
      }

    } catch (error) {
      console.error('Error loading product bodegones:', error)
    }
  }

  // Pre-populate form when editing
  useEffect(() => {
    if (productToEdit && categories.length > 0) {
      setFormData({
        name: productToEdit.name || '',
        sku: productToEdit.sku || '',
        bar_code: productToEdit.bar_code || '',
        description: productToEdit.description || '',
        price: productToEdit.price?.toString() || '',
        category_id: productToEdit.category_id || '',
        subcategory_id: productToEdit.subcategory_id || '',
        is_active: productToEdit.is_active ?? true,
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
      
      // Load subcategories if category is selected
      if (productToEdit.category_id) {
        loadSubcategories(productToEdit.category_id)
      }
      
      // Load associated bodegones
      console.log('Loading bodegones for product ID:', productToEdit.id)
      loadProductBodegones(productToEdit.id)
    } else if (!productToEdit) {
      // Clear existing images when not editing
      setExistingImageUrls([])
    }
  }, [productToEdit?.id, categories.length])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Load subcategories when category changes
    if (field === 'category_id' && value) {
      loadSubcategories(value)
      setFormData(prev => ({ ...prev, subcategory_id: '' })) // Reset subcategory
    }
  }

  const handleBodegonToggle = (bodegonId: string) => {
    setSelectedBodegones(prev => 
      prev.includes(bodegonId) 
        ? prev.filter(id => id !== bodegonId)
        : [...prev, bodegonId]
    )
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
      sku: '',
      bar_code: '',
      description: '',
      price: '',
      category_id: '',
      subcategory_id: '',
      is_active: true,
      is_discount: false,
      is_promo: false,
      discounted_price: ''
    })
    setImages([])
    setExistingImageUrls([])
    setSelectedBodegones([])
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

    if (!formData.sku.trim()) {
      toast.error('El SKU es obligatorio')
      return
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('El precio debe ser mayor a 0')
      return
    }

    if (!formData.category_id) {
      toast.error('Debe seleccionar una categoría')
      return
    }

    if (selectedBodegones.length === 0) {
      toast.error('Debe seleccionar al menos un bodegón')
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
        image_gallery_urls: allImageUrls.length > 0 ? allImageUrls : [], // Array vacío en lugar de null
        bar_code: formData.bar_code.trim() || null,
        sku: formData.sku.trim(), // Remover || null ya que SKU es requerido
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        price: parseFloat(formData.price),
        is_active: formData.is_active,
        is_discount: formData.is_discount,
        is_promo: formData.is_promo,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        ...(productToEdit 
          ? { modified_date: new Date().toISOString() } 
          : { created_by: user.auth_user.id }
        )
      }

      console.log('🔍 Product data to insert/update:', productData)
      console.log('🔍 User ID:', user.auth_user.id)
      console.log('🔍 Is editing:', !!productToEdit)

      let productResult: Record<string, unknown> | null = null

      if (productToEdit) {
        // Update existing product using Nuclear Client V2.0
        console.log('🔄 Attempting to update product with ID:', productToEdit.id)
        const updateResult = await nuclearUpdate('bodegon_products', productToEdit.id, productData, '*')
        console.log('📊 Update result:', updateResult)
        
        if (updateResult.error) {
          if (updateResult.error.includes('duplicate key value violates unique constraint "products_sku_key"')) {
            toast.error('Este SKU ya está en uso por otro producto. Por favor, ingresa un SKU diferente.')
            setIsSubmitting(false)
            return
          }
          if (updateResult.error.includes('null value in column "name"')) {
            toast.error('El nombre del producto es obligatorio.')
            setIsSubmitting(false)
            return
          }
          if (updateResult.error.includes('null value in column "price"')) {
            toast.error('El precio del producto es obligatorio.')
            setIsSubmitting(false)
            return
          }
          if (updateResult.error.includes('violates foreign key constraint')) {
            toast.error('Error de referencia: Verifique que la categoría y subcategoría sean válidas.')
            setIsSubmitting(false)
            return
          }
          toast.error('Error al actualizar el producto: ' + updateResult.error)
          setIsSubmitting(false)
          return
        }
        
        // Handle the update result data properly
        if (Array.isArray(updateResult.data) && updateResult.data.length > 0) {
          productResult = updateResult.data[0] as Record<string, unknown>
        } else if (updateResult.data) {
          productResult = updateResult.data as Record<string, unknown>
        } else {
          // If no data returned, use the original product with updated fields
          productResult = { ...productToEdit, ...productData }
        }
        
        console.log('✅ Final productResult after update:', productResult)
        console.log('✅ Final productResult ID after update:', productResult?.id)
      } else {
        // Insert new product using Nuclear Client V2.0
        console.log('🚀 Attempting to insert new product...')
        console.log('📋 Product data to insert:', productData)
        const insertResult = await nuclearInsert('bodegon_products', productData, '*')
        console.log('📊 Insert result:', insertResult)
        console.log('📊 Insert result data:', insertResult.data)
        console.log('📊 Insert result data type:', typeof insertResult.data)
        
        if (insertResult.error) {
          if (insertResult.error.includes('duplicate key value violates unique constraint "products_sku_key"')) {
            toast.error('Este SKU ya está en uso por otro producto. Por favor, ingresa un SKU diferente.')
            setIsSubmitting(false)
            return
          }
          if (insertResult.error.includes('null value in column "sku"')) {
            toast.error('El SKU es obligatorio. Por favor, ingresa un SKU para el producto.')
            setIsSubmitting(false)
            return
          }
          if (insertResult.error.includes('null value in column "name"')) {
            toast.error('El nombre del producto es obligatorio.')
            setIsSubmitting(false)
            return
          }
          if (insertResult.error.includes('null value in column "price"')) {
            toast.error('El precio del producto es obligatorio.')
            setIsSubmitting(false)
            return
          }
          if (insertResult.error.includes('violates foreign key constraint')) {
            toast.error('Error de referencia: Verifique que la categoría y subcategoría sean válidas.')
            setIsSubmitting(false)
            return
          }
          toast.error('Error al crear el producto: ' + insertResult.error)
          setIsSubmitting(false)
          return
        }
        
        // Handle the result data properly
        if (Array.isArray(insertResult.data) && insertResult.data.length > 0) {
          productResult = insertResult.data[0] as Record<string, unknown>
        } else {
          productResult = insertResult.data as Record<string, unknown>
        }
        
        console.log('✅ Final productResult:', productResult)
        console.log('✅ Final productResult ID:', productResult?.id)
      }

      // Handle inventory entries for selected bodegones
      if (productToEdit) {
        // For editing, first delete existing inventory entries using Nuclear Client V2.0
        const deleteResult = await executeNuclearQuery(async (client) => {
          return await client
            .from('bodegon_inventories')
            .delete()
            .eq('product_id', productToEdit.id)
        }, false)
        
        if (deleteResult.error) {
          toast.error('Error al eliminar inventarios existentes: ' + deleteResult.error)
          setIsSubmitting(false)
          return
        }
      }

      // Create new inventory entries for selected bodegones
      if (!productResult) {
        console.error('❌ Product result is null or undefined')
        toast.error('Error: No se pudo obtener el resultado del producto')
        setIsSubmitting(false)
        return
      }

      console.log('🔍 Product result for inventory:', productResult)
      console.log('🔍 Product ID:', productResult.id)

      if (!productResult.id) {
        console.error('❌ Product ID is null or undefined:', productResult)
        toast.error('Error: No se pudo obtener el ID del producto creado')
        setIsSubmitting(false)
        return
      }

      const inventoryEntries = selectedBodegones.map(bodegonId => ({
        product_id: productResult.id,
        bodegon_id: bodegonId,
        is_available_at_bodegon: true,
        created_by: user.auth_user.id,
        modified_date: new Date().toISOString()
      }))

      console.log('🔍 Inventory entries to create:', inventoryEntries)

      const inventoryResult = await executeNuclearQuery(async (client) => {
        return await client
          .from('bodegon_inventories')
          .insert(inventoryEntries)
      }, false)

      if (inventoryResult.error) {
        toast.error('Error al crear inventarios: ' + inventoryResult.error)
        setIsSubmitting(false)
        return
      }

      // Operación completada exitosamente
      toast.success(productToEdit ? 'Producto actualizado exitosamente' : 'Producto agregado exitosamente')
      
      // Reset form only when creating new product
      if (!productToEdit) {
        setFormData({
          name: '',
          sku: '',
          bar_code: '',
          description: '',
          price: '',
          category_id: '',
          subcategory_id: '',
          is_active: true,
          is_discount: false,
          is_promo: false,
          discounted_price: ''
        })
        setImages([])
        setExistingImageUrls([])
        setSelectedBodegones([])
      }
      
      // Navigate to products view and trigger refresh
      onBack()
    } catch (error) {
      console.error(productToEdit ? 'Error updating product:' : 'Error creating product:', error)
      toast.error(productToEdit ? 'Error inesperado al actualizar el producto' : 'Error inesperado al agregar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !user?.auth_user.id) return

    setIsCreatingCategory(true)
    try {
      const result = await nuclearInsert('bodegon_categories', {
        name: newCategoryName.trim(),
        is_active: true,
        created_by: user.auth_user.id
      }, '*')

      if (result.error) {
        toast.error('Error al crear la categoría: ' + result.error)
        return
      }

      // Operation completed successfully
      if (result.data) {
        setCategories(prev => [...prev, result.data as Category])
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
    if (!newSubcategoryName.trim() || !user?.auth_user.id || !formData.category_id) return

    setIsCreatingSubcategory(true)
    try {
      const result = await nuclearInsert('bodegon_subcategories', {
        name: newSubcategoryName.trim(),
        parent_category: formData.category_id,
        is_active: true,
        created_by: user.auth_user.id
      }, '*')

      if (result.error) {
        toast.error('Error al crear la subcategoría: ' + result.error)
        return
      }

      // Operation completed successfully
      if (result.data) {
        setSubcategories(prev => [...prev, result.data as Category])
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{productToEdit ? 'Editar Producto de Bodegón' : 'Agregar Producto de Bodegón'}</h1>
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
                  placeholder="Ej: Salsa de Tomate Premium"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="h-10 md:h-9 text-base md:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    placeholder="SKU del producto"
                    value={formData.sku}
                    onChange={(e) => handleInputChange('sku', e.target.value)}
                    className="h-10 md:h-9 text-base md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bar_code">Código de barras</Label>
                  <Input
                    id="bar_code"
                    placeholder="Código de barras"
                    value={formData.bar_code}
                    onChange={(e) => handleInputChange('bar_code', e.target.value)}
                    className="h-10 md:h-9 text-base md:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del producto de bodegón"
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
                  
                  {/* Placeholders para más imágenes (máximo 4 total) */}
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

          {/* Categorías */}
          <Card>
            <CardHeader>
              <CardTitle>Categorías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                            disabled={!newCategoryName.trim() || isCreatingCategory}
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

              {formData.category_id && subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Seleccionar una subcategoría</Label>
                  <div className="flex items-center gap-2">
                    <Select value={formData.subcategory_id} onValueChange={(value) => handleInputChange('subcategory_id', value)}>
                      <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                        <SelectValue placeholder="Seleccionar subcategoría" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {subcategories.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Popover open={subcategoryPopoverOpen} onOpenChange={setSubcategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-10 md:h-9 px-3">
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
                              disabled={!newSubcategoryName.trim() || isCreatingSubcategory}
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

          {/* Disponibilidad en Bodegones */}
          <Card>
            <CardHeader>
              <CardTitle>Disponibilidad en Bodegones *</CardTitle>
              <p className="text-sm text-gray-600">Selecciona en qué bodegones estará disponible este producto</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="all-bodegones"
                    checked={selectedBodegones.length === bodegones.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedBodegones(bodegones.map(b => b.id))
                      } else {
                        setSelectedBodegones([])
                      }
                    }}
                  />
                  <label htmlFor="all-bodegones" className="text-sm font-medium">
                    Seleccionar todo
                  </label>
                </div>
                
                {bodegones.map((bodegon) => (
                  <div key={bodegon.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={bodegon.id}
                      checked={selectedBodegones.includes(bodegon.id)}
                      onCheckedChange={() => handleBodegonToggle(bodegon.id)}
                    />
                    <label htmlFor={bodegon.id} className="text-sm">
                      {bodegon.name}
                    </label>
                  </div>
                ))}
              </div>
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
                <Select value={formData.is_active ? "active" : "inactive"} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === 'active' }))}>
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <SelectValue>
                        {formData.is_active ? 'Activo' : 'Inactivo'}
                      </SelectValue>
                    </div>
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
                <p className="text-xs text-gray-500">Establece el estado del producto de bodegón.</p>
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