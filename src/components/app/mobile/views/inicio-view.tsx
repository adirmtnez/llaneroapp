'use client'

import { useState } from 'react'
import { Search, MapPin, Star, Clock, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Mock data para categorías
const categories = [
  { id: 1, name: 'Comida Rápida', icon: '🍔', color: 'bg-red-100 text-red-600' },
  { id: 2, name: 'Bebidas', icon: '🥤', color: 'bg-blue-100 text-blue-600' },
  { id: 3, name: 'Snacks', icon: '🍿', color: 'bg-yellow-100 text-yellow-600' },
  { id: 4, name: 'Dulces', icon: '🍭', color: 'bg-pink-100 text-pink-600' },
  { id: 5, name: 'Frutas', icon: '🍎', color: 'bg-green-100 text-green-600' },
  { id: 6, name: 'Panadería', icon: '🥖', color: 'bg-orange-100 text-orange-600' }
]

// Mock data para bodegones destacados
const featuredBodegones = [
  {
    id: 1,
    name: 'Bodegón Central',
    image: '/api/placeholder/300/200',
    rating: 4.8,
    deliveryTime: '20-30 min',
    deliveryFee: 'Gratis',
    categories: ['Comida Rápida', 'Bebidas'],
    distance: '0.8 km',
    isOpen: true
  },
  {
    id: 2,
    name: 'La Esquina Sabrosa',
    image: '/api/placeholder/300/200',
    rating: 4.6,
    deliveryTime: '25-35 min',
    deliveryFee: 'Bs. 2.00',
    categories: ['Snacks', 'Dulces'],
    distance: '1.2 km',
    isOpen: true
  },
  {
    id: 3,
    name: 'Bodegón Express',
    image: '/api/placeholder/300/200',
    rating: 4.9,
    deliveryTime: '15-25 min',
    deliveryFee: 'Gratis',
    categories: ['Bebidas', 'Frutas'],
    distance: '0.5 km',
    isOpen: false
  }
]

// Mock data para acciones rápidas
const quickActions = [
  { id: 1, title: 'Pedido Rápido', subtitle: 'Repite tu último pedido', icon: '⚡', color: 'bg-purple-100 text-purple-600' },
  { id: 2, title: 'Ofertas del Día', subtitle: 'Descuentos especiales', icon: '🎯', color: 'bg-red-100 text-red-600' },
  { id: 3, title: 'Cerca de Ti', subtitle: 'Bodegones cercanos', icon: '📍', color: 'bg-green-100 text-green-600' },
  { id: 4, title: 'Favoritos', subtitle: 'Tus lugares preferidos', icon: '❤️', color: 'bg-pink-100 text-pink-600' }
]

export function InicioView() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="p-4 space-y-6">
      {/* Saludo personalizado */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">¡Hola! 👋</h2>
        <p className="text-gray-600">¿Qué te apetece hoy?</p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Buscar bodegones, productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Categorías rápidas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
        <div className="grid grid-cols-3 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="ghost"
              className="h-auto p-3 flex flex-col items-center space-y-2 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
            >
              <div className={`w-12 h-12 rounded-full ${category.color} flex items-center justify-center text-2xl`}>
                {category.icon}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {category.name}
              </span>
            </Button>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Acceso Rápido</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Card key={action.id} className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center text-lg`}>
                    {action.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{action.title}</h4>
                    <p className="text-xs text-gray-500">{action.subtitle}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bodegones destacados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bodegones Destacados</h3>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            Ver todos
          </Button>
        </div>
        
        <div className="space-y-4">
          {featuredBodegones.map((bodegon) => (
            <Card key={bodegon.id} className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex space-x-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏪</span>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{bodegon.name}</h4>
                      <Badge variant={bodegon.isOpen ? 'default' : 'secondary'} className="text-xs">
                        {bodegon.isOpen ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{bodegon.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{bodegon.deliveryTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Truck className="h-4 w-4" />
                        <span>{bodegon.deliveryFee}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        <span>{bodegon.distance}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {bodegon.categories.slice(0, 2).map((category, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}