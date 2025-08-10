'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ShoppingCart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from '../product-card'
import { ProductDetailDrawer } from '../product-detail-drawer'
import { BodegonDrawer } from '../bodegon-drawer'
import { CartDrawer } from '../cart-drawer'
import { nuclearSelect } from '@/utils/nuclear-client'
import type { BodegonCategory } from '@/types/bodegons'
import { 
  loadUserCart, 
  addToCart, 
  updateCartItemQuantity, 
  removeFromCart, 
  clearUserCart,
  findCartItem,
  type CartProductDetails 
} from '@/utils/cart-service'
import { useAuth } from '@/contexts/auth-context'
import type { BodegonPreference } from '@/utils/bodegon-preferences'

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

interface InicioViewProps {
  onNavigateToCheckout?: () => void
  selectedBodegon?: BodegonPreference
  onBodegonChange?: (bodegon: BodegonPreference) => void
}

// Los restaurantes y productos ahora se cargan de la base de datos
export function InicioView({ 
  onNavigateToCheckout, 
  selectedBodegon = { id: '', name: 'La Estrella' }, 
  onBodegonChange 
}: InicioViewProps) {
  const { user } = useAuth()
  
  // Debug: Log user state
  useEffect(() => {
    console.log('👤 Usuario actual:', user)
    console.log('🔑 User ID:', user?.id)
  }, [user])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [cartItems, setCartItems] = useState(0) // Cart items count
  const [productQuantities, setProductQuantities] = useState<Record<string | number, number>>({})
  const [categories, setCategories] = useState<BodegonCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [loadingRestaurants, setLoadingRestaurants] = useState(true)
  const [ronProducts, setRonProducts] = useState<any[]>([])
  const [loadingRonProducts, setLoadingRonProducts] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [bodegones, setBodegones] = useState<any[]>([])
  const [loadingBodegones, setLoadingBodegones] = useState(true)
  const [showBodegonDrawer, setShowBodegonDrawer] = useState(false)
  const [showCartDrawer, setShowCartDrawer] = useState(false)
  const [cartProducts, setCartProducts] = useState<CartProductDetails[]>([])
  const [loadingCart, setLoadingCart] = useState(false)

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

  // Cargar productos de Ron
  useEffect(() => {
    const loadRonProducts = async () => {
      try {
        // Primero buscar la subcategoría "Ron"
        const { data: subcategories, error: subError } = await nuclearSelect(
          'bodegon_subcategories',
          '*',
          { name: 'Ron', is_active: true }
        )
        
        if (subError || !subcategories || subcategories.length === 0) {
          console.error('Error o subcategoría Ron no encontrada:', subError)
          setLoadingRonProducts(false)
          return
        }

        const ronSubcategoryId = subcategories[0].id

        // Buscar productos de la subcategoría Ron
        const { data: products, error: prodError } = await nuclearSelect(
          'bodegon_products',
          '*, bodegon_subcategories(name)',
          { subcategory_id: ronSubcategoryId, is_active: true }
        )
        
        if (prodError) {
          console.error('Error cargando productos de Ron:', prodError)
          return
        }
        
        setRonProducts(products || [])
      } catch (error) {
        console.error('Error cargando productos de Ron:', error)
      } finally {
        setLoadingRonProducts(false)
      }
    }

    loadRonProducts()
  }, [])

  // Cargar bodegones
  useEffect(() => {
    const loadBodegones = async () => {
      try {
        const { data, error } = await nuclearSelect(
          'bodegons',
          '*',
          { is_active: true }
        )
        
        if (error) {
          console.error('Error cargando bodegones:', error)
          return
        }
        
        setBodegones(data || [])
      } catch (error) {
        console.error('Error cargando bodegones:', error)
      } finally {
        setLoadingBodegones(false)
      }
    }

    loadBodegones()
  }, [])

  // Cargar carrito del usuario
  useEffect(() => {
    if (user?.auth_user?.id) {
      loadCartFromDB()
    }
  }, [user?.auth_user?.id])

  const loadCartFromDB = async () => {
    if (!user?.auth_user?.id) return
    
    setLoadingCart(true)
    try {
      const { cartItems } = await loadUserCart(user.auth_user.id)
      setCartProducts(cartItems)
      
      // 🔄 RESETEAR COMPLETAMENTE productQuantities 
      // Esto asegura que productos eliminados del carrito muestren cantidad 0
      const quantities: Record<string | number, number> = {}
      let totalItems = 0
      
      // Solo agregar quantities para productos que están en el carrito
      cartItems.forEach(item => {
        quantities[item.id] = item.quantity
        totalItems += item.quantity
      })
      
      // ✅ Resetear estado completo - productos eliminados tendrán quantity undefined/0
      setProductQuantities(quantities)
      setCartItems(totalItems)
      
      console.log('🔄 Cart sincronizado:', { 
        cartItems: cartItems.length, 
        totalItems, 
        quantities: Object.keys(quantities).length 
      })
    } catch (error) {
      console.error('Error cargando carrito:', error)
    } finally {
      setLoadingCart(false)
    }
  }

  // Manejar cambios de cantidad de productos
  const handleProductQuantityChange = async (productId: string | number, quantity: number) => {
    console.log('🎯 handleProductQuantityChange llamado:', { productId, quantity, userId: user?.auth_user?.id })
    
    if (!user?.auth_user?.id) {
      console.log('❌ No hay usuario autenticado')
      console.log('🔍 Estado completo del usuario:', user)
      // TODO: Implementar navegación a login si es necesario
      return
    }
    
    const product = ronProducts.find(p => p.id === productId)
    if (!product) {
      console.log('❌ Producto no encontrado:', productId)
      return
    }

    console.log('📦 Producto encontrado:', { id: product.id, name: product.name, price: product.price })

    try {
      if (quantity === 0) {
        console.log('🗑️ Eliminando producto del carrito')
        // Buscar y eliminar el item del carrito
        const { item } = await findCartItem(user.auth_user.id, String(productId), true)
        if (item) {
          await removeFromCart(item.id)
        }
      } else {
        console.log('➕ Agregando/actualizando producto')
        // Buscar si ya existe en el carrito
        const { item } = await findCartItem(user.auth_user.id, String(productId), true)
        if (item) {
          console.log('📝 Producto existe, actualizando cantidad')
          // Actualizar cantidad existente
          await updateCartItemQuantity(item.id, quantity)
        } else {
          console.log('🆕 Producto nuevo, agregando al carrito')
          // Agregar nuevo producto al carrito
          const result = await addToCart(
            user.auth_user.id,
            String(productId),
            quantity,
            product.price || 0,
            product.name,
            true
          )
          console.log('🔄 Resultado addToCart:', result)
        }
      }
      
      console.log('🔄 Recargando carrito desde DB...')
      // Recargar carrito desde DB para sincronizar
      await loadCartFromDB()
    } catch (error) {
      console.error('💥 Error actualizando carrito:', error)
    }
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

  // Obtener imagen de producto
  const getProductImage = (product: any) => {
    // Primero intentar con la primera imagen del gallery
    if (product.image_gallery_urls && Array.isArray(product.image_gallery_urls) && product.image_gallery_urls.length > 0) {
      return product.image_gallery_urls[0]
    }
    
    // Luego con image_url si existe
    if (product.image_url) return product.image_url
    
    console.log('Producto sin imagen:', product.name, product)
    
    // Fallback para productos de ron
    return 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
  }

  // Manejar click en producto
  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setShowProductDetail(true)
  }

  // Manejar selección de bodegón
  const handleBodegonSelect = (bodegon: any) => {
    onBodegonChange?.({
      id: bodegon.id,
      name: bodegon.name
    })
    setShowBodegonDrawer(false)
  }

  // Manejar eliminación de producto del carrito
  const handleRemoveFromCart = async (productId: string | number) => {
    if (!user?.auth_user?.id) return

    try {
      // Buscar el order_item_id del producto en cartProducts
      const cartItem = cartProducts.find(item => item.id === String(productId))
      if (cartItem?.order_item_id) {
        await removeFromCart(cartItem.order_item_id)
        await loadCartFromDB() // Recargar carrito
      }
    } catch (error) {
      console.error('Error eliminando del carrito:', error)
    }
  }

  // Manejar cambios de cantidad desde el carrito
  const handleCartQuantityChange = async (productId: string | number, quantity: number) => {
    if (!user?.auth_user?.id) return

    try {
      // Buscar el order_item_id del producto en cartProducts
      const cartItem = cartProducts.find(item => item.id === String(productId))
      if (cartItem?.order_item_id) {
        await updateCartItemQuantity(cartItem.order_item_id, quantity)
        await loadCartFromDB() // Recargar carrito
      }
    } catch (error) {
      console.error('Error actualizando cantidad del carrito:', error)
    }
  }

  // Limpiar todo el carrito
  const handleClearCart = async () => {
    if (!user?.auth_user?.id) return

    try {
      await clearUserCart(user.auth_user.id)
      await loadCartFromDB() // Recargar carrito
    } catch (error) {
      console.error('Error limpiando carrito:', error)
    }
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
          
          {/* Bodegón selector */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => setShowBodegonDrawer(true)}
              className="flex items-center px-1 py-1 space-x-1 hover:opacity-70"
            >
              <div className="flex flex-col text-right">
                <span className="text-sm font-medium text-gray-900">Bodegón</span>
                <span className="text-xs text-gray-500">{selectedBodegon.name}</span>
              </div>
              <MapPin 
                className="text-orange-600" 
                size={24}
                style={{ width: '24px', height: '24px', minWidth: '24px', minHeight: '24px' }}
              />
            </Button>
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

      {/* Sección de Rones */}
      <div className="mt-6 pb-32">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Rones</h2>
          <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700">
            Ver todos
          </Button>
        </div>
        
        {loadingRonProducts ? (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex-shrink-0 w-[180px]">
                <div className="bg-white rounded-2xl overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-10 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : ronProducts.length > 0 ? (
          <div className="flex space-x-4 px-4 overflow-x-auto scroll-bounce">
            {ronProducts.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[180px]">
                <ProductCard
                  id={product.id}
                  name={product.name}
                  description={product.description || `${product.size || ''} ${product.volume || ''}`.trim()}
                  price={product.price || 0}
                  image={getProductImage(product)}
                  initialQuantity={productQuantities[product.id] || 0}
                  onQuantityChange={handleProductQuantityChange}
                  currency="$"
                  onClick={() => handleProductClick(product)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4">
            <div className="text-center py-8 text-gray-500">
              <p>No hay productos de ron disponibles</p>
            </div>
          </div>
        )}
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
          onClick={() => setShowCartDrawer(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          <span className="font-medium">{cartItems} productos</span>
        </Button>
      </div>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        open={showProductDetail}
        onOpenChange={setShowProductDetail}
        product={selectedProduct}
        initialQuantity={selectedProduct ? (productQuantities[selectedProduct.id] || 0) : 0}
        onQuantityChange={handleProductQuantityChange}
        currency="$"
        getProductImage={getProductImage}
      />

      {/* Bodegon Drawer */}
      <BodegonDrawer
        open={showBodegonDrawer}
        onOpenChange={setShowBodegonDrawer}
        bodegones={bodegones}
        loadingBodegones={loadingBodegones}
        selectedBodegon={selectedBodegon.name}
        onBodegonSelect={handleBodegonSelect}
      />

      {/* Cart Drawer */}
      <CartDrawer
        open={showCartDrawer}
        onOpenChange={setShowCartDrawer}
        cartItems={cartProducts}
        onQuantityChange={handleCartQuantityChange}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onNavigateToCheckout={onNavigateToCheckout}
        currency="$"
      />
    </div>
  )
}