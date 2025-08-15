'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Eye, EyeOff, X } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  title?: string
  description?: string
}

export function AuthModal({ 
  open, 
  onOpenChange, 
  onSuccess,
  title = "Inicia sesión para continuar",
  description = "Necesitas una cuenta para agregar productos al carrito"
}: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' })
    setShowPassword(false)
    setMode('login')
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          toast.error(error.message || 'Error al iniciar sesión')
        } else {
          toast.success('¡Bienvenido de vuelta!')
          handleClose()
          onSuccess?.()
        }
      } else {
        const { error } = await signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })

        if (error) {
          toast.error(error.message || 'Error al registrarse')
        } else {
          toast.success('¡Cuenta creada exitosamente!')
          handleClose()
          onSuccess?.()
        }
      }
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const AuthForm = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">
          {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          {mode === 'login' 
            ? 'Ingresa con tu cuenta existente' 
            : 'Crea tu cuenta gratis'
          }
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name field - solo en registro */}
        {mode === 'register' && (
          <div>
            <Input
              type="text"
              name="name"
              placeholder="Nombre completo"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="min-h-[56px] text-base"
            />
          </div>
        )}

        {/* Email field */}
        <div>
          <Input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="min-h-[56px] text-base"
          />
        </div>

        {/* Password field */}
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
            className="min-h-[56px] text-base pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[56px] text-base font-semibold"
        >
          {loading ? 'Cargando...' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')}
        </Button>
      </form>

      {/* Toggle mode */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          {' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setFormData({ name: '', email: '', password: '' })
              setShowPassword(false)
            }}
            className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
          >
            {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="flex flex-col max-h-[90vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
          <DrawerHeader className="text-left pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="text-lg font-semibold text-gray-900">
                  {title}
                </DrawerTitle>
                <DrawerDescription className="text-sm text-gray-600 mt-1">
                  {description}
                </DrawerDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-8">
            <AuthForm />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <AuthForm />
        </div>
      </DialogContent>
    </Dialog>
  )
}