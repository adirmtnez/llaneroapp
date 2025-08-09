'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data para bodegones destacados
const bodegonesMock = [
  {
    id: 1,
    name: 'Bodegón El Llanero',
    image: '/placeholder-bodegon.jpg',
    rating: 4.5,
    distance: '0.5 km',
    deliveryTime: '20-30 min',
    category: 'Comida Criolla',
    isOpen: true
  },
  {
    id: 2,
    name: 'Sabores de Venezuela',
    image: '/placeholder-bodegon.jpg',
    rating: 4.3,
    distance: '1.2 km',
    deliveryTime: '25-35 min',
    category: 'Tradicional',
    isOpen: true
  },
  {
    id: 3,
    name: 'La Arepa Dorada',
    image: '/placeholder-bodegon.jpg',
    rating: 4.7,
    distance: '0.8 km',
    deliveryTime: '15-25 min',
    category: 'Arepas',
    isOpen: false
  }
]

const categorias = [
  { name: 'Arepas', icon: '🫓' },
  { name: 'Empanadas', icon: '🥟' },
  { name: 'Cachapas', icon: '🌽' },
  { name: 'Tequeños', icon: '🧀' },
  { name: 'Bebidas', icon: '🥤' },
  { name: 'Postres', icon: '🍰' }
]

export default function InicioPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [userName, setUserName] = useState('Usuario')

  return (
    <div className="p-4 space-y-6">
      {/* Saludo y búsqueda */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">¡Hola, {userName}!</h2>
          <p className="text-gray-600">¿Qué te provoca comer hoy?</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Buscar bodegones, comida..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Categorías rápidas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
        <div className="grid grid-cols-3 gap-3">
          {categorias.map((categoria, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-20 flex flex-col items-center justify-center space-y-1 bg-white"
            >
              <span className="text-2xl">{categoria.icon}</span>
              <span className="text-xs font-medium">{categoria.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Bodegones destacados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Bodegones Destacados</h3>
          <Button variant="ghost" size="sm" className="text-blue-600">
            Ver todos
          </Button>
        </div>
        
        <div className="space-y-3">
          {bodegonesMock.map((bodegon) => (
            <Card key={bodegon.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex">
                  {/* Imagen */}
                  <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Imagen</span>
                  </div>
                  
                  {/* Información */}
                  <div className="flex-1 p-3 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm">{bodegon.name}</h4>
                      <Badge variant={bodegon.isOpen ? 'default' : 'secondary'} className="text-xs">
                        {bodegon.isOpen ? 'Abierto' : 'Cerrado'}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600">{bodegon.category}</p>
                    
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{bodegon.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>{bodegon.distance}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{bodegon.deliveryTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
            <span className="text-lg">📍</span>
            <span className="text-xs">Cerca de mí</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
            <span className="text-lg">⭐</span>
            <span className="text-xs">Mejor valorados</span>
          </Button>
        </div>
      </div>
    </div>
  )
}