"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { StoreIcon, Loader2 } from "lucide-react"
import { BodegonService } from "@/services/bodegons"
import { S3StorageService as StorageService } from "@/services/s3-storage"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface AddBodegonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddBodegonModal({ open, onOpenChange, onSuccess }: AddBodegonModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    logo: null as File | null
  })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])



  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create bodegon record first
      const { data: bodegon, error: createError } = await BodegonService.create(
        {
          name: formData.name,
          address: formData.address || null,
          phone_number: formData.phone || null,
          logo_url: null, // Will update this after upload
          is_active: true,
        },
        user?.auth_user.id
      )

      if (createError) {
        toast.error('Error al crear bodegón: ' + createError.message)
        setLoading(false)
        return
      }

      if (!bodegon) {
        toast.error('Error: No se pudo obtener el bodegón creado')
        setLoading(false)
        return
      }

      // Upload logo if provided, using the real bodegón ID
      if (formData.logo) {
        console.log('Uploading logo for bodegon:', bodegon.id)
        const { data: uploadData, error: uploadError } = await StorageService.uploadBodegonLogo(
          bodegon.id,
          formData.logo
        )

        if (uploadError) {
          console.error('Error uploading logo:', uploadError)
          toast.error('Error al subir logo: ' + uploadError.message)
          // Bodegón was created but logo failed - this is acceptable
        } else if (uploadData?.url) {
          // Update bodegón with logo URL
          console.log('Logo uploaded successfully, updating bodegon with URL:', uploadData.url)
          const { error: updateError } = await BodegonService.update(bodegon.id, { logo_url: uploadData.url })
          
          if (updateError) {
            console.error('Error updating bodegon with logo URL:', updateError)
            toast.error('Error al actualizar bodegón con logo: ' + updateError.message)
          } else {
            console.log('Bodegon updated successfully with logo')
          }
        }
      }

      toast.success('¡Bodegón creado exitosamente!')
      
      // Reset form
      setFormData({ name: "", address: "", phone: "", logo: null })
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Close modal
      onOpenChange(false)

    } catch (err) {
      console.error('Error creating bodegon:', err)
      toast.error('Error inesperado al crear bodegón')
    } finally {
      console.log('Finally block: setting loading to false')
      setLoading(false)
    }
  }, [formData, user, onSuccess, onOpenChange])

  const handleCancel = useCallback(() => {
    if (loading) return // Prevent closing during loading
    
    onOpenChange(false)
    // Reset form
    setFormData({ name: "", address: "", phone: "", logo: null })
  }, [loading, onOpenChange])

  const formContent = (
    <form onSubmit={handleSubmit} className={`space-y-5 ${!isDesktop ? 'pb-6' : ''}`}>
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-medium">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          key="name-input"
          id="name"
          placeholder="Ej: Bodegón Central"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="address" className="text-sm font-medium">Dirección</Label>
        <Input
          key="address-input"
          id="address"
          placeholder="Ej: Av. Principal #123, Ciudad"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="phone" className="text-sm font-medium">
          Teléfono <span className="text-red-500">*</span>
        </Label>
        <Input
          key="phone-input"
          id="phone"
          placeholder="Ej: +1234567890"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="logo" className="text-sm font-medium">Logo</Label>
        <div className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer ${!isDesktop ? 'p-8' : ''}`}>
          <input
            id="logo"
            type="file"
            accept="image/*"
            onChange={(e) => setFormData(prev => ({ ...prev, logo: e.target.files?.[0] || null }))}
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

      <div className={`flex gap-3 ${!isDesktop ? 'pt-6 sticky bottom-0 bg-white border-t -mx-4 px-4 py-4' : 'pt-4'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel} 
          disabled={loading}
          className="flex-1 h-11 md:h-10 text-base md:text-sm"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="flex-1 h-11 md:h-10 text-base md:text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            'Guardar Bodegón'
          )}
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <StoreIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <DialogTitle>Agregar Bodegón</DialogTitle>
                <DialogDescription>
                  Completa la información del nuevo bodegón
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
{formContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <StoreIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <DrawerTitle className="text-lg font-semibold">Agregar Bodegón</DrawerTitle>
              <DrawerDescription className="text-sm text-gray-600">
                Completa la información del nuevo bodegón
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
{formContent}
        </div>
      </DrawerContent>
    </Drawer>
  )
}