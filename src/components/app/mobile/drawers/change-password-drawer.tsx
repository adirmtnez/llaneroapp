'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { MenuDrawer } from '../menu-drawer'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ChangePasswordDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDrawer({ open, onOpenChange }: ChangePasswordDrawerProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const resetForm = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    })
  }

  const handleSave = async () => {
    if (!user?.auth_user?.email) {
      toast.error('Error: Usuario no autenticado')
      return
    }

    // Validaciones
    if (!formData.currentPassword.trim()) {
      toast.error('La contraseña actual es requerida')
      return
    }

    if (!formData.newPassword.trim()) {
      toast.error('La nueva contraseña es requerida')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error('La nueva contraseña debe ser diferente a la actual')
      return
    }

    setIsLoading(true)

    try {
      // Paso 1: Verificar contraseña actual intentando hacer sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.auth_user.email,
        password: formData.currentPassword
      })

      if (signInError) {
        toast.error('La contraseña actual es incorrecta')
        return
      }

      // Paso 2: Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword
      })

      if (updateError) {
        toast.error('Error al actualizar la contraseña')
        console.error('Error updating password:', updateError)
        return
      }

      toast.success('Contraseña actualizada exitosamente')
      resetForm()
      onOpenChange(false)
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Error inesperado al cambiar la contraseña')
    } finally {
      setIsLoading(false)
    }
  }

  // Resetear formulario cuando se cierre el drawer
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  return (
    <MenuDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title="Cambiar contraseña"
    >
      <div className="space-y-3 py-6 px-4">
        {/* Formulario */}
        <div className="space-y-3">
          {/* Contraseña actual */}
          <div className="space-y-2">
            <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
              Contraseña actual *
            </Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="min-h-[56px] text-base bg-white pr-12"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('current')}
                disabled={isLoading}
              >
                {showPasswords.current ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Separador */}
          <div className="py-2">
            <hr className="border-gray-200" />
          </div>

          {/* Nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
              Nueva contraseña *
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                placeholder="Ingresa tu nueva contraseña"
                className="min-h-[56px] text-base bg-white pr-12"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('new')}
                disabled={isLoading}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Mínimo 6 caracteres
            </p>
          </div>

          {/* Confirmar nueva contraseña */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
              Confirmar nueva contraseña *
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirma tu nueva contraseña"
                className="min-h-[56px] text-base bg-white pr-12"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => togglePasswordVisibility('confirm')}
                disabled={isLoading}
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-xs text-red-600">
                Las contraseñas no coinciden
              </p>
            )}
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading || !formData.currentPassword.trim() || !formData.newPassword.trim() || !formData.confirmPassword.trim() || formData.newPassword !== formData.confirmPassword}
            className="w-full min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cambiando contraseña...</span>
              </div>
            ) : (
              'Cambiar contraseña'
            )}
          </Button>
        </div>

        {/* Información de seguridad */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Tu contraseña será actualizada de forma segura. Mantén tus credenciales privadas y usa una contraseña fuerte.
          </p>
        </div>
      </div>
    </MenuDrawer>
  )
}