'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Star, Clock, ShoppingCart, User, Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'

// Mock data para la versión desktop
const featuredBodegones = [
  {
    id: 1,
    name: 'Bodegón Central',
    rating: 4.8,
    deliveryTime: '20-30 min',
    distance: '0.8 km',
    categories: ['Comida Rápida', 'Bebidas'],
    image: '🏪',
    isOpen: true,
    featured: true
  },
  {
    id: 2,
    name: 'La Esquina Sabrosa',
    rating: 4.6,
    deliveryTime: '25-35 min',
    distance: '1.2 km',
    categories: ['Snacks', 'Dulces'],
    image: '🏬',
    isOpen: true,
    featured: true
  },
  {
    id: 3,
    name: 'Bodegón Express',
    rating: 4.7,
    deliveryTime: '15-25 min',
    distance: '0.5 km',
    categories: ['Bebidas', 'Snacks'],
    image: '🏪',
    isOpen: true,
    featured: false
  },
  {
    id: 4,
    name: 'Rincón del Sabor',
    rating: 4.5,
    deliveryTime: '30-40 min',
    distance: '1.5 km',
    categories: ['Comida Rápida', 'Postres'],
    image: '🏬',
    isOpen: false,
    featured: false
  }
]

const categories = [
  { id: 'comida', name: 'Comida Rápida', icon: '🍔', count: 12 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', count: 8 },
  { id: 'snacks', name: 'Snacks', icon: '🍿', count: 15 },
  { id: 'dulces', name: 'Dulces', icon: '🍭', count: 6 },
  { id: 'frutas', name: 'Frutas', icon: '🍎', count: 4 },
  { id: 'panaderia', name: 'Panadería', icon: '🥖', count: 7 }
]

const recentOrders = [
  {
    id: 'PED-001',
    bodegon: 'Bodegón Central',
    status: 'delivered',
    total: 'Bs. 27.50',
    date: 'Hoy, 14:30'
  },
  {
    id: 'PED-002',
    bodegon: 'La Esquina Sabrosa',
    status: 'delivered',
    total: 'Bs. 15.00',
    date: 'Ayer, 19:15'
  }
]

export default function DesktopContent() {
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const filteredBodegones = featuredBodegones.filter(bodegon => {
    const matchesSearch = bodegon.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      bodegon.categories.some(cat => cat.toLowerCase().includes(selectedCategory))
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold text-blue-600">🏪 Llanero Bodegón</div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar bodegones, productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <ShoppingCart className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user?.auth_user?.email || ''} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                    {user?.auth_user?.email?.charAt(0).toUpperCase() || user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Salir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="col-span-3 space-y-6">
            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Categorías</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory('all')}
                >
                  <span className="mr-2">🏪</span>
                  Todos los bodegones
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'ghost'}
                    className="w-full justify-between"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{order.bodegon}</span>
                      <Badge variant="outline" className="text-xs">
                        {order.status === 'delivered' ? 'Entregado' : order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{order.date}</span>
                      <span className="font-medium text-blue-600">{order.total}</span>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full">
                  Ver todos los pedidos
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9 space-y-6">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">
                      ¡Bienvenido a Llanero Bodegón! 👋
                    </h1>
                    <p className="text-blue-100">
                      Descubre los mejores bodegones cerca de ti y haz tus pedidos fácilmente.
                    </p>
                  </div>
                  <div className="text-6xl opacity-20">🏪</div>
                </div>
              </CardContent>
            </Card>

            {/* Featured Bodegones */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchQuery ? `Resultados para "${searchQuery}"` : 'Bodegones Destacados'}
                </h2>
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBodegones.map((bodegon) => (
                  <Card key={bodegon.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-3xl">{bodegon.image}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{bodegon.name}</h3>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{bodegon.rating}</span>
                              <span>•</span>
                              <Clock className="h-3 w-3" />
                              <span>{bodegon.deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                        {bodegon.featured && (
                          <Badge className="bg-orange-100 text-orange-600">
                            Destacado
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 mb-3">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{bodegon.distance}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          bodegon.isOpen ? 'bg-green-400' : 'bg-red-400'
                        }`} />
                        <span className={`text-sm ${
                          bodegon.isOpen ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {bodegon.isOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {bodegon.categories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>

                      <Button className="w-full" disabled={!bodegon.isOpen}>
                        {bodegon.isOpen ? 'Ver Menú' : 'Cerrado'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredBodegones.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron bodegones
                  </h3>
                  <p className="text-gray-500">
                    Intenta con otros términos de búsqueda o categorías.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}