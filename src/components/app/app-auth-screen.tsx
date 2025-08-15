'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export default function AppAuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

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
          toast.success('¡Bienvenido!')
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png" 
          alt="Llanero" 
          className="w-[150px] h-auto mx-auto"
        />
      </div>

      {/* Auth Card */}
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                {mode === 'login' 
                  ? 'Ingresa a tu cuenta para continuar' 
                  : 'Crea tu cuenta para empezar'
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
                  }}
                  className="text-orange-600 hover:text-orange-700 font-medium hover:underline"
                >
                  {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer info */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Al continuar, aceptas nuestros términos y condiciones
        </p>
      </div>
    </div>
  )
}