'use client'

import { useState } from 'react'
import { 
  User, 
  MapPin, 
  Bell, 
  HelpCircle,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Shield,
  Tag,
  Key,
  FileText,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'

// Mock data del usuario basado en el mockup
const userData = {
  name: 'Adirson',
  email: 'adirsonmtnez@gmail.com',
  initials: 'A'
}

// Opciones del menú principal
const mainMenuOptions = [
  {
    icon: User,
    label: 'Información personal',
    hasWarning: true,
    action: 'personal-info'
  },
  {
    icon: Key,
    label: 'Cambiar contraseña',
    hasWarning: false,
    action: 'change-password'
  },
  {
    icon: Tag,
    label: 'Cupones',
    hasWarning: false,
    action: 'cupones'
  },
  {
    icon: Bell,
    label: 'Notificaciones',
    hasWarning: false,
    action: 'notifications'
  },
  {
    icon: MapPin,
    label: 'Administrar direcciones',
    hasWarning: false,
    action: 'addresses'
  }
]

// Opciones secundarias y políticas
const secondaryMenuOptions = [
  {
    icon: HelpCircle,
    label: 'Soporte',
    hasWarning: false,
    action: 'support'
  },
  {
    icon: FileText,
    label: 'Términos y Condiciones',
    hasWarning: false,
    action: 'terms-conditions'
  },
  {
    icon: Lock,
    label: 'Políticas de Privacidad',
    hasWarning: false,
    action: 'privacy-policy'
  },
  {
    icon: Shield,
    label: 'Cerrar mi cuenta',
    hasWarning: false,
    isDestructive: true,
    action: 'close-account'
  },
  {
    icon: LogOut,
    label: 'Cerrar sesión',
    hasWarning: false,
    isDestructive: true,
    action: 'logout'
  }
]

export function CuentaView() {
  const { signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleMenuAction = (action: string) => {
    if (action === 'logout') {
      handleLogout()
    } else {
      // Aquí se implementarían las otras acciones específicas
      console.log('Acción:', action)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header con perfil de usuario */}
      <div className="p-6">
        <div className="flex flex-col items-center text-center space-y-3">
          {/* Avatar circular */}
          <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl font-bold">{userData.initials}</span>
          </div>
          
          {/* Información del usuario */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{userData.name}</h2>
            <p className="text-gray-600 text-sm">{userData.email}</p>
          </div>
        </div>
      </div>

      {/* Lista de opciones principales */}
      <div className="flex-1 p-4 space-y-4 pb-24">
        {/* Card principal */}
        <Card className="overflow-hidden shadow-none rounded-[30px]">
          <div className="divide-y divide-gray-200">
            {mainMenuOptions.map((option, index) => {
              const IconComponent = option.icon
              
              return (
                <button
                  key={index}
                  onClick={() => handleMenuAction(option.action)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-gray-900"
                >
                  <div className="flex items-center space-x-4">
                    <IconComponent className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {option.hasWarning && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        {/* Card secundaria */}
        <Card className="overflow-hidden shadow-none rounded-[30px]">
          <div className="divide-y divide-gray-200">
            {secondaryMenuOptions.map((option, index) => {
              const IconComponent = option.icon
              
              return (
                <button
                  key={index}
                  onClick={() => handleMenuAction(option.action)}
                  className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                    option.isDestructive ? 'text-red-600' : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <IconComponent className={`h-5 w-5 ${
                      option.isDestructive ? 'text-red-600' : 'text-gray-600'
                    }`} />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {option.hasWarning && (
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                    )}
                    {!option.isDestructive && (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>

    </div>
  )
}