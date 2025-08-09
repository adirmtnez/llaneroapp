'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Mock data para ofertas del slider
const offers = [
  {
    id: 1,
    title: '¡Oferta Especial!',
    subtitle: '50% de descuento en todos los rones',
    background: 'bg-gradient-to-r from-red-500 to-pink-500'
  },
  {
    id: 2,
    title: '¡Envío Gratis!',
    subtitle: 'En pedidos mayores a Bs. 50',
    background: 'bg-gradient-to-r from-blue-500 to-purple-500'
  },
  {
    id: 3,
    title: '¡2x1 en Bebidas!',
    subtitle: 'Válido hasta agotar existencias',
    background: 'bg-gradient-to-r from-green-500 to-teal-500'
  }
]

// Mock data para categorías
const categories = [
  {
    id: 1,
    name: 'LICORES',
    image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=300&fit=crop&crop=center',
    color: 'from-amber-600 to-amber-800'
  },
  {
    id: 2,
    name: 'MERCADO',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center',
    color: 'from-green-600 to-green-800'
  },
  {
    id: 3,
    name: 'BEBIDAS',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&crop=center',
    color: 'from-blue-600 to-blue-800'
  },
  {
    id: 4,
    name: 'SNACKS',
    image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop&crop=center',
    color: 'from-orange-600 to-orange-800'
  }
]

// Mock data para restaurantes
const restaurants = [
  {
    id: 1,
    name: 'Boulevard Rose',
    logo: '🌹'
  },
  {
    id: 2,
    name: 'La Nave',
    logo: '🚢'
  },
  {
    id: 3,
    name: 'Orinoco Grill',
    logo: '🔥'
  },
  {
    id: 4,
    name: 'Café Central',
    logo: '☕'
  },
  {
    id: 5,
    name: 'Pizza House',
    logo: '🍕'
  },
  {
    id: 6,
    name: 'Burger King',
    logo: '🍔'
  }
]
export function InicioView() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartItems, setCartItems] = useState(2) // Mock cart items count
  const [selectedBodegon, setSelectedBodegon] = useState('Todos los bodegones')

  // Auto-slide para el carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offers.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 relative">
      {/* Header simplificado */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png" 
              alt="Llanero" 
              className="w-[120px] h-auto"
            />
          </div>
          
          {/* Map pin icon */}
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Slider de ofertas */}
      <div className="relative mx-4 mt-4">
        <div className="overflow-hidden rounded-[30px] h-[150px]">
          <div 
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {offers.map((offer) => (
              <div key={offer.id} className="w-full flex-shrink-0 h-full">
                <div className={`${offer.background} text-white p-6 rounded-[30px] h-full flex flex-col justify-center`}>
                  <h3 className="text-xl font-bold mb-2">{offer.title}</h3>
                  <p className="text-white/90">{offer.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Indicadores del slider */}
        <div className="flex justify-center mt-3 space-x-2">
          {offers.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-red-500' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Sección de categorías */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 px-4 mb-3">Categorías</h2>
        <div className="flex space-x-4 px-4 overflow-x-auto">
          {categories.map((category) => (
            <div key={category.id} className="flex-shrink-0 w-[200px]">
              <Card className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden p-0 rounded-[30px]">
                <div className="relative h-[100px]">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.color} opacity-80`} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm text-center">
                      {category.name}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Sección de restaurantes */}
      <div className="mt-6 pb-24">
        <h2 className="text-lg font-semibold text-gray-900 px-4 mb-3">Restaurantes</h2>
        <div className="flex space-x-4 px-4 overflow-x-auto">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="flex-shrink-0 text-center">
              <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mx-auto mb-2 cursor-pointer hover:shadow-lg transition-shadow">
                <span className="text-3xl">{restaurant.logo}</span>
              </div>
              <span className="text-xs text-gray-700 font-medium max-w-[80px] block">{restaurant.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Píldora flotante del carrito */}
      {cartItems > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button 
            className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3 shadow-lg flex items-center space-x-2"
            onClick={() => {/* TODO: Abrir carrito */}}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">{cartItems} productos</span>
          </Button>
        </div>
      )}
    </div>
  )
}