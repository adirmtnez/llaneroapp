"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StoreIcon, Loader2 } from "lucide-react"
import { BodegonService } from "@/services/bodegons"
import { S3StorageService as StorageService } from "@/services/s3-storage"
import { useAuth } from "@/contexts/auth-context"
import { useSupabase } from "@/contexts/supabase-context"
import { toast } from "sonner"
import { BodegonWithDetails } from "@/types/bodegons"

interface EditBodegonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  bodegon: BodegonWithDetails | null
}

export function EditBodegonModal({ open, onOpenChange, onSuccess, bodegon }: EditBodegonModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    is_active: true,
    logo: null as File | null
  })
  const [loading, setLoading] = useState(false)

  const { user } = useAuth()
  const { client } = useSupabase()

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    const handleAuthRestored = () => {
      console.log('Auth restored in EditBodegonModal, resetting loading state')
      setLoading(false)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    window.addEventListener('authRestored', handleAuthRestored)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
      window.removeEventListener('authRestored', handleAuthRestored)
    }
  }, [])

  // Initialize form data when bodegon changes
  useEffect(() => {
    if (bodegon) {
      setFormData({
        name: bodegon.name || "",
        address: bodegon.address || "",
        phone: bodegon.phone_number || "",
        is_active: bodegon.is_active ?? true,
        logo: null
      })
    }
  }, [bodegon])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bodegon) return
    
    setLoading(true)

    try {
      // ✅ SOLUCIÓN NUCLEAR - Obtener token del localStorage directamente
      let accessToken: string | null = null
      try {
        const supabaseSession = localStorage.getItem('sb-zykwuzuukrmgztpgnbth-auth-token')
        if (supabaseSession) {
          const parsedSession = JSON.parse(supabaseSession)
          accessToken = parsedSession?.access_token
        }
      } catch (error) {
        toast.error('Error de autenticación')
        setLoading(false)
        return
      }
      
      if (!accessToken) {
        toast.error('Token de autenticación no válido, recarga la página')
        setLoading(false)
        return
      }
      
      // Crear cliente fresco para edición
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
      
      // ✅ Capturar valores directamente del DOM
      const formElement = (e.target as HTMLFormElement)
      const nameInput = formElement.querySelector('#edit-name') as HTMLInputElement
      const addressInput = formElement.querySelector('#edit-address') as HTMLInputElement
      const phoneInput = formElement.querySelector('#edit-phone') as HTMLInputElement
      const logoInput = formElement.querySelector('#edit-logo') as HTMLInputElement
      
      const actualValues = {
        name: nameInput?.value || formData.name || '',
        address: addressInput?.value || formData.address || '',
        phone: phoneInput?.value || formData.phone || '',
        logo: logoInput?.files?.[0] || null
      }

      // Update bodegon record
      const updateData: any = {
        name: actualValues.name,
        address: actualValues.address || null,
        phone_number: actualValues.phone || null,
        is_active: formData.is_active,
        modified_date: new Date().toISOString(),
      }

      // Upload new logo if provided
      if (actualValues.logo) {
        const { data: uploadData, error: uploadError } = await StorageService.uploadBodegonLogo(
          bodegon.id,
          actualValues.logo
        )

        if (uploadError) {
          toast.error('Error al subir logo: ' + uploadError.message)
          setLoading(false)
          return
        } else if (uploadData?.url) {
          updateData.logo_url = uploadData.url
        }
      }

      const { data: result, error: updateError } = await nuclearClient
        .from('bodegons')
        .update(updateData)
        .eq('id', bodegon.id)
        .select()
        .single()

      if (updateError) {
        toast.error('Error al actualizar bodegón: ' + updateError.message)
        setLoading(false)
        return
      }

      toast.success('¡Bodegón actualizado exitosamente!')
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }

      // Close modal
      onOpenChange(false)

    } catch (err) {
      toast.error('Error inesperado al actualizar bodegón')
    } finally {
      setLoading(false)
    }
  }, [formData, bodegon, onSuccess, onOpenChange])

  const handleCancel = useCallback(() => {
    if (loading) return // Prevent closing during loading
    
    onOpenChange(false)
    // Reset form to original values
    if (bodegon) {
      setFormData({
        name: bodegon.name || "",
        address: bodegon.address || "",
        phone: bodegon.phone_number || "",
        is_active: bodegon.is_active ?? true,
        logo: null
      })
    }
  }, [loading, onOpenChange, bodegon])

  const formContent = (
    <form onSubmit={handleSubmit} className={`space-y-5 ${!isDesktop ? 'pb-6' : ''}`}>
      <div className="space-y-3">
        <Label htmlFor="edit-name" className="text-sm font-medium">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          key="edit-name-input"
          id="edit-name"
          placeholder="Ej: Bodegón Central"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-address" className="text-sm font-medium">Dirección</Label>
        <Input
          key="edit-address-input"
          id="edit-address"
          placeholder="Ej: Av. Principal #123, Ciudad"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-phone" className="text-sm font-medium">
          Teléfono <span className="text-red-500">*</span>
        </Label>
        <Input
          key="edit-phone-input"
          id="edit-phone"
          placeholder="Ej: +1234567890"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          required
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-active" className="text-sm font-medium">Estado</Label>
        <Select 
           value={formData.is_active ? "active" : "inactive"} 
           onValueChange={(value) => setFormData(prev => ({ ...prev, is_active: value === "active" }))}
         >
           <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
               <span>{formData.is_active ? 'Activo' : 'Inactivo'}</span>
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
      </div>

      <div className="space-y-3">
        <Label htmlFor="edit-logo" className="text-sm font-medium">Logo</Label>
        {bodegon?.logo_url && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Logo actual:</p>
            <img 
              src={bodegon.logo_url} 
              alt="Logo actual" 
              className="w-16 h-16 object-cover rounded-lg border"
            />
          </div>
        )}
        <div className={`relative border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer ${!isDesktop ? 'p-8' : ''}`}>
          <input
            id="edit-logo"
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
                  {bodegon?.logo_url ? 'Cambiar logo' : 'Haz clic para subir una imagen'}
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
              Actualizando...
            </>
          ) : (
            'Actualizar Bodegón'
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
                <DialogTitle>Editar Bodegón</DialogTitle>
                <DialogDescription>
                  Modifica la información del bodegón
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
              <DrawerTitle className="text-lg font-semibold">Editar Bodegón</DrawerTitle>
              <DrawerDescription className="text-sm text-gray-600">
                Modifica la información del bodegón
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