'use client'

import { useState } from 'react'
import { Search, Filter, MapPin, Star, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// Mock data para filtros de categorías
const categories = [
  { id: 'all', name: 'Todos', active: true },
  { id: 'comida', name: 'Comida Rápida', active: false },
  { id: 'bebidas', name: 'Bebidas', active: false },
  { id: 'snacks', name: 'Snacks', active: false },
  { id: 'dulces', name: 'Dulces', active: false },
  { id: 'frutas', name: 'Frutas', active: false }
]

// Mock data para resultados de búsqueda
const searchResults = {
  bodegones: [
    {
      id: 1,
      name: 'Bodegón Central',
      rating: 4.8,
      deliveryTime: '20-30 min',
      distance: '0.8 km',
      categories: ['Comida Rápida', 'Bebidas'],
      isOpen: true
    },
    {
      id: 2,
      name: 'La Esquina Sabrosa',
      rating: 4.6,
      deliveryTime: '25-35 min',
      distance: '1.2 km',
      categories: ['Snacks', 'Dulces'],
      isOpen: true
    }
  ],
  productos: [
    {
      id: 1,
      name: 'Coca Cola 350ml',
      price: 'Bs. 3.50',
      bodegon: 'Bodegón Central',
      category: 'Bebidas',
      image: '🥤'
    },
    {
      id: 2,
      name: 'Hamburguesa Clásica',
      price: 'Bs. 12.00',
      bodegon: 'La Esquina Sabrosa',
      category: 'Comida Rápida',
      image: '🍔'
    },
    {
      id: 3,
      name: 'Papas Fritas',
      price: 'Bs. 8.00',
      bodegon: 'Bodegón Central',
      category: 'Snacks',
      image: '🍟'
    }
  ]
}

// Mock data para búsquedas recientes
const recentSearches = [
  'Coca Cola',
  'Hamburguesa',
  'Bodegón Central',
  'Papas fritas',
  'Dulces'
]

export function BuscarView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [showResults, setShowResults] = useState(false)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(query.length > 0)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setShowResults(false)
  }

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query)
    setShowResults(true)
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Buscar</h2>
        
        {/* Barra de búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Buscar bodegones, productos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-12 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filtros de categoría */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
          <Button variant="ghost" size="sm" className="text-blue-600">
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap rounded-full"
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Contenido principal */}
      {!showResults ? (
        /* Búsquedas recientes */
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Búsquedas Recientes</h3>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
                onClick={() => handleRecentSearch(search)}
              >
                <div className="flex items-center space-x-3">
                  <Search className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{search}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      ) : (
        /* Resultados de búsqueda */
        <div className="space-y-6">
          {/* Bodegones */}
          {searchResults.bodegones.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Bodegones ({searchResults.bodegones.length})
              </h3>
              <div className="space-y-3">
                {searchResults.bodegones.map((bodegon) => (
                  <Card key={bodegon.id} className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🏪</span>
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
                              <MapPin className="h-4 w-4" />
                              <span>{bodegon.distance}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {bodegon.categories.map((category, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Productos */}
          {searchResults.productos.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Productos ({searchResults.productos.length})
              </h3>
              <div className="space-y-3">
                {searchResults.productos.map((producto) => (
                  <Card key={producto.id} className="border-gray-200 hover:border-blue-300 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{producto.image}</span>
                        </div>
                        
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-gray-900">{producto.name}</h4>
                          <p className="text-sm text-gray-600">{producto.bodegon}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {producto.category}
                            </Badge>
                            <span className="font-bold text-blue-600">{producto.price}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}