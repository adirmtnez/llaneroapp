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
import { ArrowLeftIcon, PlusIcon, UploadIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useSupabaseQuery } from "@/contexts/supabase-context"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
}

interface Bodegon {
  id: string
  name: string
}

export function AgregarProductoBodegonView({ onBack }: { onBack: () => void }) {
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
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const { isReady, sessionValid } = useSupabaseQuery()

  // Load categories
  const loadCategories = async () => {
    if (!isReady || !sessionValid) return

    try {
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        return
      }
      
      if (!accessToken) return

      const { createClient } = await import('@supabase/supabase-js')
      const loadClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          },
          db: { schema: 'public' }
        }
      )

      const { data: categoriesData } = await loadClient
        .from('bodegon_categories')
        .select('id, name')
        .order('name')

      if (categoriesData) {
        setCategories(categoriesData)
      }

      const { data: bodegonesData } = await loadClient
        .from('bodegons')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (bodegonesData) {
        setBodegones(bodegonesData)
      }

    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Load subcategories when category changes
  const loadSubcategories = async (categoryId: string) => {
    if (!isReady || !sessionValid || !categoryId) return

    try {
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        return
      }
      
      if (!accessToken) return

      const { createClient } = await import('@supabase/supabase-js')
      const loadClient = createClient(
        'https://zykwuzuukrmgztpgnbth.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5a3d1enV1a3JtZ3p0cGduYnRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzM5MTQsImV4cCI6MjA2OTM0OTkxNH0.w2L8RtmI8q4EA91o5VUGnuxHp87FJYRI5-CFOIP_Hjw',
        {
          auth: { persistSession: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          },
          db: { schema: 'public' }
        }
      )

      const { data: subcategoriesData } = await loadClient
        .from('bodegon_subcategories')
        .select('id, name')
        .eq('parent_category', categoryId)
        .order('name')

      if (subcategoriesData) {
        setSubcategories(subcategoriesData)
      }

    } catch (error) {
      console.error('Error loading subcategories:', error)
    }
  }

  useEffect(() => {
    if (isReady && sessionValid) {
      loadCategories()
    }
  }, [isReady, sessionValid])

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

    if (selectedBodegones.length === 0) {
      toast.error('Debe seleccionar al menos un bodegón')
      return
    }

    setIsSubmitting(true)

    try {
      // Here would go the actual save logic
      toast.success('Producto agregado exitosamente')
      onBack()
    } catch (error) {
      toast.error('Error al agregar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="h-10 md:h-8">
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Agregar Producto de Bodegón</h1>
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
              
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
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
                    </div>
                  ))}
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
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" className="h-10 md:h-9 px-3">
                    <PlusIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {formData.category_id && subcategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Subcategoría</Label>
                  <Select value={formData.subcategory_id} onValueChange={(value) => handleInputChange('subcategory_id', value)}>
                    <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                      <SelectValue placeholder="Seleccionar subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
      <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 p-4 z-10">
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
            {isSubmitting ? 'Guardando...' : 'Agregar Producto'}
          </Button>
        </div>
      </div>
    </div>
  )
}