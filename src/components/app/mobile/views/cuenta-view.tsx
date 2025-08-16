'use client'

import { useState } from 'react'
import { 
  User, 
  MapPin, 
  HelpCircle,
  LogOut,
  ChevronRight,
  AlertTriangle,
  Shield,
  Tag,
  Key,
  FileText,
  Lock,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { PersonalInfoDrawer } from '../drawers/personal-info-drawer'
import { ChangePasswordDrawer } from '../drawers/change-password-drawer'
import { CouponsDrawer } from '../drawers/coupons-drawer'
import { AddressesDrawer } from '../drawers/addresses-drawer'

// Función para obtener iniciales del nombre
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

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
  const { user, signOut } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Verificar si falta información telefónica
  const hasPhoneWarning = !user?.profile?.phone_dial || !user?.profile?.phone_number
  
  // Generar opciones del menú principal con advertencias dinámicas
  const mainMenuOptions = [
    {
      icon: User,
      label: 'Información personal',
      hasWarning: hasPhoneWarning,
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
      icon: MapPin,
      label: 'Administrar direcciones',
      hasWarning: false,
      action: 'addresses'
    }
  ]
  
  // Estados para controlar los drawers
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)

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
    switch (action) {
      case 'personal-info':
        setShowPersonalInfo(true)
        break
      case 'change-password':
        setShowChangePassword(true)
        break
      case 'cupones':
        setShowCoupons(true)
        break
      case 'addresses':
        setShowAddresses(true)
        break
      case 'logout':
        handleLogout()
        break
      case 'login':
        // Redirigir a la página de autenticación
        window.location.href = '/auth'
        break
      default:
        // Para las opciones de la segunda card (soporte, términos, etc.)
        console.log('Acción:', action)
        break
    }
  }

  // Obtener datos del usuario o valores por defecto
  const userData = {
    name: user?.profile?.name || user?.auth_user?.email?.split('@')[0] || 'Usuario',
    email: user?.auth_user?.email || 'usuario@ejemplo.com',
    initials: user?.profile?.name 
      ? getInitials(user.profile.name) 
      : user?.auth_user?.email 
        ? getInitials(user.auth_user.email.split('@')[0]) 
        : 'U'
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      {/* Header con perfil de usuario */}
      {user && (
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
      )}

      {/* Lista de opciones */}
      <div className="flex-1 p-4 space-y-4 pb-24">
        {user ? (
          // Usuario autenticado - mostrar opciones del menú
          <>
            {/* Card principal - Solo para usuarios autenticados */}
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

            {/* Card secundaria - Para usuarios autenticados */}
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
          </>
        ) : (
          <>
            {/* Card de login/registro - Para usuarios no autenticados */}
            <Card className="overflow-hidden shadow-none rounded-[30px]">
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Inicia sesión o regístrate
                </h3>
                <p className="text-gray-500 text-sm mb-6">
                  Accede a tu cuenta para gestionar tus pedidos, direcciones y más
                </p>
                <Button
                  className="w-full min-h-[56px] rounded-full font-semibold text-base"
                  style={{ backgroundColor: '#F5E9E3', color: '#ea580c' }}
                  onClick={() => handleMenuAction('login')}
                >
                  Ingresar / Registrarse
                </Button>
              </div>
            </Card>

            {/* Card de opciones públicas - Para usuarios no autenticados */}
            <Card className="overflow-hidden shadow-none rounded-[30px]">
              <div className="divide-y divide-gray-200">
                {secondaryMenuOptions
                  .filter(option => ['support', 'terms-conditions', 'privacy-policy'].includes(option.action))
                  .map((option, index) => {
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
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </button>
                    )
                  })}
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Drawers para cada opción de menú */}
      <PersonalInfoDrawer
        open={showPersonalInfo}
        onOpenChange={setShowPersonalInfo}
      />
      
      <ChangePasswordDrawer
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
      />
      
      <CouponsDrawer
        open={showCoupons}
        onOpenChange={setShowCoupons}
      />
      
      <AddressesDrawer
        open={showAddresses}
        onOpenChange={setShowAddresses}
      />
    </div>
  )
}