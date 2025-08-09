'use client'

import { useState } from 'react'
import { 
  User, 
  MapPin, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Settings, 
  LogOut, 
  ChevronRight,
  Edit,
  Plus,
  Star,
  Gift,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'

// Mock data del usuario
const userData = {
  name: 'María González',
  email: 'maria.gonzalez@email.com',
  phone: '+58 412-123-4567',
  avatar: '',
  memberSince: 'Enero 2024',
  totalOrders: 23,
  favoriteStores: 5,
  points: 150
}

// Mock data de direcciones
const addresses = [
  {
    id: 1,
    label: 'Casa',
    address: 'Av. Principal #123, Caracas',
    isDefault: true
  },
  {
    id: 2,
    label: 'Trabajo',
    address: 'Centro Comercial, Piso 3, Oficina 301',
    isDefault: false
  }
]

// Opciones del menú
const menuOptions = [
  {
    icon: Bell,
    label: 'Notificaciones',
    description: 'Gestiona tus preferencias',
    action: 'notifications'
  },
  {
    icon: CreditCard,
    label: 'Métodos de Pago',
    description: 'Tarjetas y billeteras',
    action: 'payment'
  },
  {
    icon: Star,
    label: 'Mis Favoritos',
    description: 'Bodegones y productos',
    action: 'favorites'
  },
  {
    icon: Gift,
    label: 'Promociones',
    description: 'Ofertas y descuentos',
    action: 'promotions'
  },
  {
    icon: HelpCircle,
    label: 'Ayuda y Soporte',
    description: 'FAQ y contacto',
    action: 'help'
  },
  {
    icon: Shield,
    label: 'Privacidad y Seguridad',
    description: 'Configuración de cuenta',
    action: 'privacy'
  },
  {
    icon: Settings,
    label: 'Configuración',
    description: 'Preferencias generales',
    action: 'settings'
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
    // Aquí se implementarían las acciones específicas
    console.log('Acción:', action)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Mi Cuenta</h2>
      </div>

      {/* Perfil del usuario */}
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={userData.avatar} alt={userData.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                {userData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{userData.name}</h3>
              <p className="text-sm text-gray-500">{userData.email}</p>
              <p className="text-sm text-gray-500">{userData.phone}</p>
              <p className="text-xs text-gray-400 mt-1">Miembro desde {userData.memberSince}</p>
            </div>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{userData.totalOrders}</div>
            <div className="text-xs text-gray-500">Pedidos</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{userData.favoriteStores}</div>
            <div className="text-xs text-gray-500">Favoritos</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{userData.points}</div>
            <div className="text-xs text-gray-500">Puntos</div>
          </CardContent>
        </Card>
      </div>

      {/* Direcciones */}
      <Card className="border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mis Direcciones</h3>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {addresses.map((address) => (
              <div key={address.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{address.label}</span>
                    {address.isDefault && (
                      <Badge variant="secondary" className="text-xs">Principal</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{address.address}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Opciones del menú */}
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {menuOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleMenuAction(option.action)}
                className="w-full flex items-center space-x-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <option.icon className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-sm text-gray-500">{option.description}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botón de cerrar sesión */}
      <Card className="border-red-200">
        <CardContent className="p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </Button>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <p>Llanero Bodegón v1.0.0</p>
        <p>© 2024 Todos los derechos reservados</p>
      </div>
    </div>
  )
}