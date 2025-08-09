'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from '../product-card'
import { nuclearSelect } from '@/utils/nuclear-client'
import type { BodegonCategory } from '@/types/bodegons'

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

// Imágenes por defecto para categorías
const defaultCategoryImages: Record<string, string> = {
  'licores': 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=300&fit=crop&crop=center',
  'bebidas': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop&crop=center',
  'mercado': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop&crop=center',
  'snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop&crop=center',
  'default': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop&crop=center'
}

// Los restaurantes ahora se cargan de la base de datos

// Mock data para productos destacados
const featuredProducts = [
  {
    id: 1,
    name: 'Whisky Old 63',
    description: '0.70L / 40G',
    price: 11.5,
    image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 2,
    name: 'Old Label Premium',
    description: '0.70L / 39G',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 3,
    name: 'Ron Añejo Especial',
    description: '0.75L / 40G',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center'
  },
  {
    id: 4,
    name: 'Vodka Premium',
    description: '0.70L / 37.5G',
    price: 8.75,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop&crop=center'
  }
]
export function InicioView() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartItems, setCartItems] = useState(2) // Mock cart items count
  const [selectedBodegon, setSelectedBodegon] = useState('Todos los bodegones')
  const [productQuantities, setProductQuantities] = useState<Record<string | number, number>>({})
  const [categories, setCategories] = useState<BodegonCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)

  // Auto-slide para el carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offers.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  // Cargar categorías reales
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await nuclearSelect(
          'bodegon_categories',
          '*',
          { is_active: true }
        )
        
        if (error) {
          console.error('Error cargando categorías:', error)
          return
        }
        
        setCategories(data || [])
      } catch (error) {
        console.error('Error cargando categorías:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // Cargar restaurantes reales
  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        const { data, error } = await nuclearSelect(
          'restaurants',
          '*',
          { is_active: true }
        )
        
        if (error) {
          console.error('Error cargando restaurantes:', error)
          return
        }
        
        setRestaurants(data || [])
      } catch (error) {
        console.error('Error cargando restaurantes:', error)
      } finally {
        setLoadingRestaurants(false)
      }
    }

    loadRestaurants()
  }, [])

  // Manejar cambios de cantidad de productos
  const handleProductQuantityChange = (productId: string | number, quantity: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [productId]: quantity
    }))
    
    // Actualizar contador total del carrito
    const totalItems = Object.values({
      ...productQuantities,
      [productId]: quantity
    }).reduce((sum, qty) => sum + qty, 0)
    
    setCartItems(totalItems)
  }

  // Obtener imagen de categoría
  const getCategoryImage = (category: BodegonCategory) => {
    // Primero intentar con image (columna de la tabla)
    if (category.image) return category.image
    // Luego con image_url si existe
    if (category.image_url) return category.image_url
    
    console.log('Categoría sin imagen:', category.name, category)
    
    const categoryKey = category.name.toLowerCase()
    return defaultCategoryImages[categoryKey] || defaultCategoryImages.default
  }

  // Obtener logo de restaurante
  const getRestaurantLogo = (restaurant: any) => {
    if (restaurant.logo_url) return restaurant.logo_url
    
    console.log('Restaurante sin logo:', restaurant.name, restaurant)
    
    // Fallback a una imagen por defecto
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop&crop=center'
  }

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
        {loadingCategories ? (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[200px]">
                <div className="h-[100px] bg-gray-200 rounded-[30px] animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {categories.map((category) => (
              <div key={category.id} className="flex-shrink-0 w-[200px]">
                <div className="cursor-pointer hover:scale-105 transition-transform overflow-hidden rounded-[30px] h-[100px] relative">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Error cargando imagen:', category.name, getCategoryImage(category))
                      e.currentTarget.src = defaultCategoryImages.default
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de restaurantes */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900 px-4 mb-3">Restaurantes</h2>
        {loadingRestaurants ? (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse mx-auto mb-2" />
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {restaurants.map((restaurant) => (
              <div key={restaurant.id} className="flex-shrink-0 text-center">
                <div 
                  className="w-20 h-20 rounded-full shadow-md mx-auto mb-2 cursor-pointer hover:shadow-lg transition-shadow bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${getRestaurantLogo(restaurant)})`
                  }}
                />
                <span className="text-xs text-gray-700 font-medium max-w-[80px] block truncate">
                  {restaurant.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de productos destacados */}
      <div className="mt-6 pb-32">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Productos Destacados</h2>
          <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
            Ver todos
          </Button>
        </div>
        
        <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
          {featuredProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[180px]">
              <ProductCard
                id={product.id}
                name={product.name}
                description={product.description}
                price={product.price}
                image={product.image}
                initialQuantity={productQuantities[product.id] || 0}
                onQuantityChange={handleProductQuantityChange}
                currency="$"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Píldora flotante del carrito */}
      <div 
        className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          cartItems > 0 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-90 pointer-events-none'
        }`}
      >
        <Button 
          className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3 shadow-lg flex items-center space-x-2 hover:scale-105 transition-transform"
          onClick={() => {/* TODO: Abrir carrito */}}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">{cartItems} productos</span>
        </Button>
      </div>
    </div>
  )
}