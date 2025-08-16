'use client'

import { useState, useEffect } from 'react'
import { User, Loader2, ChevronDown, AlertTriangle } from 'lucide-react'
import { MenuDrawer } from '../menu-drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { nuclearUpdate } from '@/utils/nuclear-client'
import { toast } from 'sonner'

interface PersonalInfoDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonalInfoDrawer({ open, onOpenChange }: PersonalInfoDrawerProps) {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phonePrefix: '',
    phoneNumber: ''
  })

  // Opciones de prefijos telefónicos venezolanos
  const phoneOptions = [
    { value: '0414', label: '0414' },
    { value: '0424', label: '0424' },
    { value: '0416', label: '0416' },
    { value: '0426', label: '0426' },
    { value: '0412', label: '0412' }
  ]

  // Cargar datos del usuario cuando se abra el drawer
  useEffect(() => {
    if (open && user) {
      const phoneNumber = user.profile?.phone_number || ''
      const phoneDialFromProfile = user.profile?.phone_dial || ''
      
      // Priorizar datos separados si existen
      let phonePrefix = phoneDialFromProfile
      let phoneNumberOnly = phoneNumber
      
      // Si no hay phone_dial pero hay phone_number con prefijo concatenado (legacy)
      if (!phoneDialFromProfile && phoneNumber) {
        // Fallback: buscar si el número inicia con alguno de los prefijos
        const foundPrefix = phoneOptions.find(option => phoneNumber.startsWith(option.value))
        if (foundPrefix) {
          phonePrefix = foundPrefix.value
          phoneNumberOnly = phoneNumber.slice(foundPrefix.value.length)
        } else {
          phoneNumberOnly = phoneNumber
        }
      }
      
      setFormData({
        name: user.profile?.name || '',
        phonePrefix,
        phoneNumber: phoneNumberOnly
      })
    }
  }, [open, user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrefixChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phonePrefix: value
    }))
  }

  const handleSave = async () => {
    if (!user?.auth_user?.id) {
      toast.error('Error: Usuario no autenticado')
      return
    }

    // Validaciones básicas
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    // Validar teléfono si se proporciona
    if (formData.phoneNumber && !/^\d{7}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      toast.error('El número debe tener 7 dígitos')
      return
    }
    
    if (formData.phoneNumber && !formData.phonePrefix) {
      toast.error('Selecciona un prefijo telefónico')
      return
    }

    setIsLoading(true)

    try {
      // Preparar datos de actualización
      const updateData: any = {
        name: formData.name.trim()
      }
      
      // Guardar phone_dial y phone_number por separado
      if (formData.phoneNumber && formData.phonePrefix) {
        updateData.phone_number = formData.phoneNumber.trim() // Solo el número sin prefijo
        updateData.phone_dial = formData.phonePrefix // Solo el prefijo
      } else {
        // Si se borra el teléfono, limpiar ambos campos
        updateData.phone_number = ''
        updateData.phone_dial = ''
      }
      
      // Actualizar perfil usando el método del contexto
      const { error } = await updateProfile(updateData)

      if (error) {
        toast.error('Error al actualizar la información')
        return
      }
      
      toast.success('Información actualizada correctamente')
      onOpenChange(false)
    } catch (error) {
      console.error('Error actualizando perfil:', error)
      toast.error('Error inesperado al guardar')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MenuDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Información personal"
    >
      <div className="space-y-3 py-6 px-4">
        {/* Formulario */}
        <div className="space-y-3">
          {/* Campo Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre completo *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ingresa tu nombre completo"
              className="min-h-[56px] text-base bg-white"
              disabled={isLoading}
            />
          </div>

          {/* Campo Teléfono */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-gray-700">
                Teléfono
              </Label>
              {(!formData.phonePrefix || !formData.phoneNumber) && (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <div className="flex gap-2">
              {/* Dropdown de prefijo */}
              <Select
                value={formData.phonePrefix}
                onValueChange={handlePrefixChange}
                disabled={isLoading}
              >
                <SelectTrigger className="w-24 min-h-[56px] text-base bg-white">
                  <SelectValue placeholder="0414" />
                </SelectTrigger>
                <SelectContent>
                  {phoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Input del número */}
              <Input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => {
                  // Solo permitir números y limitar a 7 dígitos
                  const value = e.target.value.replace(/\D/g, '').slice(0, 7)
                  handleInputChange('phoneNumber', value)
                }}
                placeholder="1234567"
                className="flex-1 min-h-[56px] text-base bg-white"
                disabled={isLoading}
                maxLength={7}
              />
            </div>
            <p className="text-xs text-gray-500">
              Selecciona el prefijo y ingresa 7 dígitos
            </p>
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.name.trim()}
            className="w-full min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Guardando...</span>
              </div>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Esta información se utilizará para personalizar tu experiencia y procesar tus pedidos.
          </p>
        </div>
      </div>
    </MenuDrawer>
  )
}