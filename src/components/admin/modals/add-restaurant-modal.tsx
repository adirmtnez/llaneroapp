"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { UtensilsCrossedIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface AddRestaurantModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddRestaurantModal({ open, onOpenChange, onSuccess }: AddRestaurantModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
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
      console.log('Auth restored in AddRestaurantModal, resetting loading state')
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 🚀 NUCLEAR CLIENT V2.0 - Solución híbrida optimizada
      const { nuclearInsert, nuclearUpdate } = await import('@/utils/nuclear-client')
      
      // ✅ Capturar valores directamente del DOM y estado
      const formElement = (e.target as HTMLFormElement)
      const nameInput = formElement.querySelector('#name') as HTMLInputElement
      const phoneInput = formElement.querySelector('#phone') as HTMLInputElement
      const logoInput = formElement.querySelector('#logo') as HTMLInputElement
      
      const actualValues = {
        name: nameInput?.value || '',
        phone_number: phoneInput?.value || '',
        logo: logoInput?.files?.[0] || null,
        delivery_available: true, // Por defecto activo
        pickup_available: true    // Por defecto activo
      }
      
      // ✅ Subir logo primero si fue seleccionado
      let logoUrl = null
      if (actualValues.logo) {
        try {
          const { S3StorageService } = await import('@/services/s3-storage')
          // Generar un ID temporal para el logo
          const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          logoUrl = await S3StorageService.uploadRestaurantLogo(actualValues.logo, tempId)
          console.log('Logo subido exitosamente:', logoUrl)
        } catch (logoError) {
          console.error('Error subiendo logo:', logoError)
          toast.error('Error subiendo logo. Intenta de nuevo.')
          setLoading(false)
          return
        }
      }

      const insertData = {
        name: actualValues.name || 'Restaurante Sin Nombre',
        phone_number: actualValues.phone_number || null,
        logo_url: logoUrl,
        delivery_available: actualValues.delivery_available,
        pickup_available: actualValues.pickup_available,
        is_active: true,
        created_by: user?.auth_user.id,
        created_at: new Date().toISOString(),
      }
      
      console.log('📋 Datos a insertar:', insertData)
      console.log('🔧 Valores actuales del form:', actualValues)
      
      // 🚀 Usar Nuclear Insert V2.0 con auto-recovery
      const { data: restaurant, error: createError } = await nuclearInsert(
        'restaurants',
        insertData,
        '*'
      )

      if (createError || !restaurant) {
        // Si falló la inserción y habíamos subido un logo, intentar limpiarlo
        if (logoUrl) {
          try {
            const { S3StorageService } = await import('@/services/s3-storage')
            await S3StorageService.deleteRestaurantLogo(logoUrl)
          } catch (cleanupError) {
            console.warn('Error limpiando logo después de fallar inserción:', cleanupError)
          }
        }
        setLoading(false)
        return // Error ya manejado por Nuclear Client
      }

      toast.success("Restaurante agregado exitosamente")
      
      // ✅ Reset form después de éxito
      setFormData({
        name: "",
        phone_number: "",
        logo: null
      })
      
      // Clear form inputs
      const form = e.target as HTMLFormElement
      form.reset()
      
      onSuccess?.()
      onOpenChange(false)
      
    } catch (error) {
      console.error('Error agregando restaurante:', error)
      toast.error('Error inesperado al agregar restaurante')
    } finally {
      setLoading(false)
    }
  }, [user, onSuccess, onOpenChange])

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
                    Haz clic para subir una imagen
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF hasta 10MB
                  </p>
                </>
              )}
            </div>
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
              Creando...
            </>
          ) : (
            "Crear Restaurante"
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
              Agregar Restaurante
            </DialogTitle>
            <DialogDescription>
              Completa la información para agregar un nuevo restaurante
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
            Agregar Restaurante
          </DrawerTitle>
          <DrawerDescription>
            Completa la información para agregar un nuevo restaurante
          </DrawerDescription>
        </DrawerHeader>
        {formContent}
      </DrawerContent>
    </Drawer>
  )
}