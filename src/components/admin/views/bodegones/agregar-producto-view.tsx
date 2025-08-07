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
import { useSupabaseQuery } from "@/contexts/supabase-context"
import { SupabaseClient } from "@supabase/supabase-js"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  price: number
  is_active_product: boolean | null
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
  is_active_product?: boolean
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
    is_active_product: true,
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
  const { executeQuery } = useSupabaseQuery()
  const { isReady, sessionValid } = useSupabaseQuery()

  // Load categories - Nuclear Solution
  const loadCategories = async () => {
    if (!isReady || !sessionValid) return

    try {
      // ✅ SOLUCIÓN NUCLEAR - Patrón del CLAUDE.md
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        return
      }
      
      if (!accessToken) {
        toast.error('Token no válido, recarga la página')
        return
      }

      // Crear cliente fresco
      const { createClient } = await import('@supabase/supabase-js')
      const nuclearClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        }
      )

      // Ejecutar operaciones directas
      const { data: categoriesData, error: categoriesError } = await nuclearClient
        .from('bodegon_categories')
        .select('id, name')
        .order('name')

      if (categoriesError) {
        toast.error('Error al cargar categorías: ' + categoriesError.message)
        return
      }

      const { data: bodegonesData, error: bodegonesError } = await nuclearClient
        .from('bodegons')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (bodegonesError) {
        toast.error('Error al cargar bodegones: ' + bodegonesError.message)
        return
      }

      // Operaciones completadas exitosamente
      if (categoriesData) {
        setCategories(categoriesData)
      }

      if (bodegonesData) {
        setBodegones(bodegonesData)
      }

    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error inesperado al cargar datos')
    }
  }

  // Load subcategories when category changes - Nuclear Solution
  const loadSubcategories = async (categoryId: string) => {
    if (!isReady || !sessionValid || !categoryId) return

    try {
      // ✅ SOLUCIÓN NUCLEAR - Patrón del CLAUDE.md
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        return
      }
      
      if (!accessToken) {
        toast.error('Token no válido, recarga la página')
        return
      }

      // Crear cliente fresco
      const { createClient } = await import('@supabase/supabase-js')
      const nuclearClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        }
      )

      // Ejecutar operación directa
      const { data: subcategoriesData, error: subcategoriesError } = await nuclearClient
        .from('bodegon_subcategories')
        .select('id, name')
        .eq('parent_category', categoryId)
        .order('name')

      if (subcategoriesError) {
        toast.error('Error al cargar subcategorías: ' + subcategoriesError.message)
        return
      }

      // Operación completada exitosamente
      if (subcategoriesData) {
        setSubcategories(subcategoriesData)
      }

    } catch (error) {
      console.error('Error loading subcategories:', error)
      toast.error('Error inesperado al cargar subcategorías')
    }
  }

  useEffect(() => {
    if (isReady && sessionValid) {
      loadCategories()
    }
  }, [isReady, sessionValid])

  // Load product bodegones when editing
  const loadProductBodegones = async (productId: string) => {
    if (!isReady || !sessionValid) return

    try {
      const { data: inventoryData, error } = await executeQuery(
        (client: SupabaseClient) => client
          .from('bodegon_inventories')
          .select('bodegon_id')
          .eq('product_id', productId)
      )

      if (error) {
        console.error('Error loading product bodegones:', error)
        return
      }

      if (inventoryData) {
        const bodegonIds = inventoryData.map(item => item.bodegon_id)
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
        is_active_product: productToEdit.is_active_product ?? true,
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
  }, [productToEdit?.id, categories.length, isReady, sessionValid])

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
      is_active_product: true,
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
      // ✅ SOLUCIÓN NUCLEAR - Patrón del CLAUDE.md
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        setIsSubmitting(false)
        return
      }
      
      if (!accessToken) {
        toast.error('Token no válido, recarga la página')
        setIsSubmitting(false)
        return
      }

      // Crear cliente fresco
      const { createClient } = await import('@supabase/supabase-js')
      const nuclearClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        }
      )

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
        image_gallery_urls: allImageUrls.length > 0 ? allImageUrls : null,
        bar_code: formData.bar_code.trim() || null,
        sku: formData.sku.trim() || null,
        category_id: formData.category_id || null,
        subcategory_id: formData.subcategory_id || null,
        price: parseFloat(formData.price),
        is_active_product: formData.is_active_product,
        is_discount: formData.is_discount,
        is_promo: formData.is_promo,
        discounted_price: formData.discounted_price ? parseFloat(formData.discounted_price) : null,
        ...(productToEdit ? { modified_date: new Date().toISOString() } : { created_by: user.auth_user.id })
      }

      let productResult: Record<string, unknown> | null = null

      if (productToEdit) {
        // Update existing product
        const { data: updateResult, error: productError } = await nuclearClient
          .from('bodegon_products')
          .update(productData)
          .eq('id', productToEdit.id)
          .select()
          .single()
        
        if (productError) {
          if (productError.message.includes('duplicate key value violates unique constraint "products_sku_key"')) {
            toast.error('Este SKU ya está en uso por otro producto. Por favor, ingresa un SKU diferente.')
            setIsSubmitting(false)
            return
          }
          toast.error('Error al actualizar el producto: ' + productError.message)
          setIsSubmitting(false)
          return
        }
        
        productResult = updateResult
      } else {
        // Insert new product
        const { data: insertResult, error: productError } = await nuclearClient
          .from('bodegon_products')
          .insert(productData)
          .select()
          .single()
        
        if (productError) {
          if (productError.message.includes('duplicate key value violates unique constraint "products_sku_key"')) {
            toast.error('Este SKU ya está en uso por otro producto. Por favor, ingresa un SKU diferente.')
            setIsSubmitting(false)
            return
          }
          if (productError.message.includes('null value in column "sku"')) {
            toast.error('El SKU es obligatorio. Por favor, ingresa un SKU para el producto.')
            setIsSubmitting(false)
            return
          }
          toast.error('Error al crear el producto: ' + productError.message)
          setIsSubmitting(false)
          return
        }
        
        productResult = insertResult
      }

      // Handle inventory entries for selected bodegones
      if (productToEdit) {
        // For editing, first delete existing inventory entries
        const { error: deleteInventoryError } = await nuclearClient
          .from('bodegon_inventories')
          .delete()
          .eq('product_id', productToEdit.id)
        
        if (deleteInventoryError) {
          toast.error('Error al eliminar inventarios existentes: ' + deleteInventoryError.message)
          setIsSubmitting(false)
          return
        }
      }

      // Create new inventory entries for selected bodegones
      const inventoryEntries = selectedBodegones.map(bodegonId => ({
        product_id: productResult.id,
        bodegon_id: bodegonId,
        is_available_at_bodegon: true,
        created_by: user.auth_user.id,
        modified_date: new Date().toISOString()
      }))

      const { error: inventoryError } = await nuclearClient
        .from('bodegon_inventories')
        .insert(inventoryEntries)

      if (inventoryError) {
        toast.error('Error al crear inventarios: ' + inventoryError.message)
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
          is_active_product: true,
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
      // ✅ SOLUCIÓN NUCLEAR - Patrón del CLAUDE.md
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        return
      }
      
      if (!accessToken) {
        toast.error('Token no válido, recarga la página')
        return
      }

      // Crear cliente fresco
      const { createClient } = await import('@supabase/supabase-js')
      const nuclearClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        }
      )

      // Ejecutar operación directa
      const { data, error } = await nuclearClient
        .from('bodegon_categories')
        .insert({
          name: newCategoryName.trim(),
          is_active: true,
          created_by: user.auth_user.id
        })
        .select()
        .single()

      if (error) {
        toast.error('Error al crear la categoría: ' + error.message)
        return
      }

      // Operación completada exitosamente
      setCategories(prev => [...prev, data])
      setNewCategoryName('')
      setCategoryPopoverOpen(false)
      toast.success('Categoría creada exitosamente')

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
      // ✅ SOLUCIÓN NUCLEAR - Patrón del CLAUDE.md
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        return
      }
      
      if (!accessToken) {
        toast.error('Token no válido, recarga la página')
        return
      }

      // Crear cliente fresco
      const { createClient } = await import('@supabase/supabase-js')
      const nuclearClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        }
      )

      // Ejecutar operación directa
      const { data, error } = await nuclearClient
        .from('bodegon_subcategories')
        .insert({
          name: newSubcategoryName.trim(),
          parent_category: formData.category_id,
          is_active: true,
          created_by: user.auth_user.id
        })
        .select()
        .single()

      if (error) {
        toast.error('Error al crear la subcategoría: ' + error.message)
        return
      }

      // Operación completada exitosamente
      setSubcategories(prev => [...prev, data])
      setNewSubcategoryName('')
      setSubcategoryPopoverOpen(false)
      toast.success('Subcategoría creada exitosamente')

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
                <Select value={formData.is_active_product ? "active" : "inactive"} onValueChange={(value) => setFormData(prev => ({ ...prev, is_active_product: value === 'active' }))}>
                  <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${formData.is_active_product ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <SelectValue>
                        {formData.is_active_product ? 'Activo' : 'Inactivo'}
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