"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { UtensilsCrossedIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { RestaurantWithDetails } from "@/services/restaurants"

interface EditRestaurantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  restaurant: RestaurantWithDetails | null
}

export function EditRestaurantModal({ open, onOpenChange, onSuccess, restaurant }: EditRestaurantModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    delivery_available: true,
    pickup_available: true,
    is_active: true,
    logo: null as File | null
  })
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(true)

  const { user } = useAuth()

  useEffect(() => {
    const checkDevice = () => {
      if (isMounted) setIsDesktop(window.innerWidth >= 768)
    }

    const handleAuthRestored = () => {
      console.log('Auth restored in EditRestaurantModal, resetting loading state')
      if (isMounted) setLoading(false)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('authRestored', handleAuthRestored)
    
    return () => {
      setIsMounted(false)
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('authRestored', handleAuthRestored)
      setLoading(false)
    }
  }, [])

  // Populate form when restaurant data is available
  useEffect(() => {
    if (restaurant && open) {
      setFormData({
        name: restaurant.name || "",
        phone_number: restaurant.phone_number || "",
        delivery_available: restaurant.delivery_available ?? true,
        pickup_available: restaurant.pickup_available ?? true,
        is_active: restaurant.is_active ?? true,
        logo: null
      })
    }
  }, [restaurant, open])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!restaurant) {
      toast.error('No se encontró información del restaurante')
      return
    }

    setLoading(true)

    try {
      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada
      const { nuclearUpdate } = await import('@/utils/nuclear-client')
      
      // ✅ Capturar valores directamente del DOM y estado
      const formElement = (e.target as HTMLFormElement)
      const nameInput = formElement.querySelector('#name') as HTMLInputElement
      const phoneInput = formElement.querySelector('#phone') as HTMLInputElement
      const logoInput = formElement.querySelector('#logo') as HTMLInputElement
      
      const actualValues = {
        name: nameInput?.value || '',
        phone_number: phoneInput?.value || '',
        logo: logoInput?.files?.[0] || null,
        delivery_available: formData.delivery_available,
        pickup_available: formData.pickup_available,
        is_active: formData.is_active
      }

      // ✅ Subir nuevo logo si fue seleccionado
      let logoUrl = restaurant.logo_url // Mantener logo actual por defecto
      if (actualValues.logo) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          
          // Eliminar logo anterior si existe
          if (restaurant.logo_url) {
            try {
              await S3StorageService.deleteRestaurantLogo(restaurant.logo_url)
            } catch (deleteError) {
              console.warn('Error eliminando logo anterior:', deleteError)
              // Continue - no es crítico
            }
          }

          // Subir nuevo logo
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          logoUrl = await S3StorageService.uploadRestaurantLogo(actualValues.logo, tempId)
          console.log('Nuevo logo subido exitosamente:', logoUrl)
        } catch (logoError) {
          console.error('Error subiendo nuevo logo:', logoError)
          toast.error('Error subiendo nuevo logo')
          setLoading(false)
          return
        }
      }

      const updateData = {
        name: actualValues.name || 'Restaurante Sin Nombre',
        phone_number: actualValues.phone_number || null,
        logo_url: logoUrl,
        delivery_available: actualValues.delivery_available,
        pickup_available: actualValues.pickup_available,
        is_active: actualValues.is_active,
        modified_at: new Date().toISOString(),
      }
      
      console.log('📋 Datos a actualizar:', updateData)
      console.log('🔧 Valores actuales del form:', actualValues)
      
      // 🚀 Usar Nuclear Update V2.0 con auto-recovery
      const { data: updatedRestaurant, error: updateError } = await nuclearUpdate(
        'restaurants',
        restaurant.id,
        updateData,
        '*'
      )

      if (updateError || !updatedRestaurant) {
        // Si falló la actualización y subimos un nuevo logo, intentar limpiar
        if (actualValues.logo && logoUrl !== restaurant.logo_url) {
          try {
            const { S3StorageService } = await import('@/services/s3-storage')
            await S3StorageService.deleteRestaurantLogo(logoUrl)
          } catch (cleanupError) {
            console.warn('Error limpiando nuevo logo después de fallar actualización:', cleanupError)
          }
        }
        setLoading(false)
        return // Error ya manejado por Nuclear Client
      }

      toast.success("Restaurante actualizado exitosamente")
      
      onSuccess?.()
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error actualizando restaurante:', error)
      toast.error('Error inesperado al actualizar restaurante')
    } finally {
      setLoading(false)
    }
  }, [restaurant, formData, onSuccess, onOpenChange])

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Restaurante *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ej: Restaurante El Buen Sabor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-11 text-base min-h-[44px]"
            required
          />
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="Ej: +58 424 123 4567"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="h-11 text-base min-h-[44px]"
          />
        </div>

        {/* Logo */}
        <div className="space-y-3">
          <Label htmlFor="logo" className="text-sm font-medium">Logo</Label>
          <div className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer ${!isDesktop ? 'p-8' : ''}`}>
            <input
              id="logo"
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] || null })}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-center">
              {formData.logo ? (
                <div className="flex items-center gap-3 text-green-600">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{formData.logo.name}</p>
                    <p className="text-xs text-gray-500">
                      {(formData.logo.size / 1024 / 1024).toFixed(2)} MB
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
                    {restaurant?.logo_url ? 'Cambiar logo' : 'Haz clic para subir una imagen'}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="space-y-3">
          <Label htmlFor="status">Estado</Label>
          <Select 
            value={formData.is_active ? "active" : "inactive"} 
            onValueChange={(value) => setFormData({ ...formData, is_active: value === "active" })}
          >
            <SelectTrigger className="h-11 text-base min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="inactive">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Servicios Disponibles */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Servicios Disponibles</Label>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="delivery" className="text-sm font-medium">
                Delivery
              </Label>
              <p className="text-xs text-gray-500">
                El restaurante realiza entregas a domicilio
              </p>
            </div>
            <Switch
              id="delivery"
              checked={formData.delivery_available}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, delivery_available: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pickup" className="text-sm font-medium">
                Pickup
              </Label>
              <p className="text-xs text-gray-500">
                Los clientes pueden recoger pedidos en el local
              </p>
            </div>
            <Switch
              id="pickup"
              checked={formData.pickup_available}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, pickup_available: checked })
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-4">
        <Button
          type="submit"
          disabled={loading || !formData.name.trim()}
          className="h-11 text-base font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Actualizar Restaurante"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="h-11 text-base"
        >
          Cancelar
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossedIcon className="w-5 h-5" />
              Editar Restaurante
            </DialogTitle>
            <DialogDescription>
              Modifica la información del restaurante
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-4">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <UtensilsCrossedIcon className="w-5 h-5" />
            Editar Restaurante
          </DrawerTitle>
          <DrawerDescription>
            Modifica la información del restaurante
          </DrawerDescription>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  )
}