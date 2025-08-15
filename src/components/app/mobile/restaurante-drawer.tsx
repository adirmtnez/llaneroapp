'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Star, Grid3X3, TrendingUp, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductCard } from './product-card'
import { ProductDetailDrawer } from './product-detail-drawer'
import { publicSelect } from '@/utils/nuclear-client'
import type { Restaurant } from '@/types/restaurants'

interface RestauranteDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: Restaurant | null
  onQuantityChange: (productId: string | number, quantity: number) => void
  productQuantities: Record<string | number, number>
  loadingProductId: string | number | null
  currency?: string
}

type TabType = 'todos' | 'popular' | 'ofertas'

// Componente para mostrar reseñas
const ReviewsSection = ({ rating, reviewCount }: { rating: number, reviewCount: number }) => (
  <div className="flex items-center gap-1">
    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
    <span className="font-semibold text-gray-900">{rating}</span>
    <span className="text-gray-500">({reviewCount}+ reviews)</span>
  </div>
)

// Componente para el contenido de productos
const ProductsContent = ({ 
  loadingProducts, 
  filteredProducts, 
  activeTab,
  productQuantities,
  onQuantityChange,
  loadingProductId,
  currency,
  getProductImage,
  handleProductClick
}: {
  loadingProducts: boolean
  filteredProducts: any[]
  activeTab: string
  productQuantities: Record<string | number, number>
  onQuantityChange: (productId: string | number, quantity: number) => void
  loadingProductId: string | number | null
  currency: string
  getProductImage: (product: any) => string
  handleProductClick: (product: any) => void
}) => {
  if (loadingProducts) {
    return (
      <div className="grid grid-cols-2 gap-4 pb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
            <div className="p-4 space-y-3">
              <div className="aspect-square bg-gray-200 rounded-2xl" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-10 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (filteredProducts.length > 0) {
    return (
      <div className="grid grid-cols-2 gap-4 pb-6">
        {filteredProducts.map((product, index) => (
          <div 
            key={product.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ProductCard
              id={product.id}
              name={product.name}
              description={product.description || ''}
              price={product.discounted_price || product.price || 0}
              originalPrice={product.is_discount && product.price !== product.discounted_price ? product.price : undefined}
              image={getProductImage(product)}
              initialQuantity={productQuantities[product.id] || 0}
              onQuantityChange={onQuantityChange}
              currency={currency}
              onClick={() => handleProductClick(product)}
              loading={loadingProductId === product.id}
              isPromo={product.is_promo}
              isDiscount={product.is_discount}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="text-center py-12 pb-6">
      <div className="text-gray-500">
        {activeTab === 'ofertas' ? (
          <>
            <p className="text-lg font-medium">No hay ofertas disponibles</p>
            <p className="text-sm mt-1">Este restaurante no tiene productos en oferta actualmente</p>
          </>
        ) : (
          <>
            <p className="text-lg font-medium">No hay productos disponibles</p>
            <p className="text-sm mt-1">Este restaurante no tiene productos activos</p>
          </>
        )}
      </div>
    </div>
  )
}

export function RestauranteDrawer({ 
  open, 
  onOpenChange, 
  restaurant,
  onQuantityChange,
  productQuantities,
  loadingProductId,
  currency = '$'
}: RestauranteDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('todos')
  const [products, setProducts] = useState<any[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showProductDetail, setShowProductDetail] = useState(false)

  // Cargar productos del restaurante cuando se abre el drawer
  useEffect(() => {
    if (open && restaurant) {
      loadRestaurantProducts()
    }
  }, [open, restaurant, activeTab])

  const loadRestaurantProducts = async () => {
    if (!restaurant) return
    
    setLoadingProducts(true)
    try {
      let query = publicSelect(
        'restaurant_products',
        `
          id, name, description, price, image_gallery_urls, sku,
          is_active, is_discount, is_promo, discounted_price, created_date,
          category_id, subcategory_id,
          restaurant_categories!category_id(name), 
          restaurant_subcategories!subcategory_id(name)
        `,
        { restaurant_id: restaurant.id, is_active: true }
      )

      // Aplicar filtros según el tab activo
      if (activeTab === 'popular') {
        // Para popular, podríamos ordenar por ventas o rating (por ahora por fecha)
        // query = query.order('created_date', { ascending: false }).limit(20)
      } else if (activeTab === 'ofertas') {
        // Solo productos con descuento o promoción
        // query = query.or('is_discount.eq.true,is_promo.eq.true')
      }

      const { data, error } = await query

      if (error) {
        console.error('Error cargando productos del restaurante:', error)
        setProducts([])
      } else {
        console.log('🍽️ Productos del restaurante cargados:', data)
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error cargando productos del restaurante:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }

  // Obtener imagen del restaurante
  const getRestaurantImage = (restaurant: Restaurant) => {
    if (restaurant.header_image_url) return restaurant.header_image_url
    if (restaurant.logo_url) return restaurant.logo_url
    
    // Imagen por defecto de restaurante
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop&crop=center'
  }

  // Obtener imagen de producto
  const getProductImage = (product: any) => {
    if (product.image_gallery_urls && Array.isArray(product.image_gallery_urls) && product.image_gallery_urls.length > 0) {
      return product.image_gallery_urls[0]
    }
    
    if (product.image_url) return product.image_url
    
    // Imagen por defecto de producto de restaurante
    return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=400&fit=crop&crop=center'
  }

  // Manejar click en producto
  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setShowProductDetail(true)
  }

  // Filtrar productos según el tab activo
  const filteredProducts = products.filter(product => {
    switch (activeTab) {
      case 'popular':
        // Por ahora mostrar todos, en el futuro podríamos usar datos de ventas
        return true
      case 'ofertas':
        // Solo productos con descuento o promoción
        return product.is_discount || product.is_promo
      default: // 'todos'
        return true
    }
  })

  if (!restaurant) return null

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} modal={true}>
        <DrawerContent 
          className="flex flex-col h-[90vh] rounded-t-[20px] focus:outline-none focus-visible:outline-none border-none ring-0" 
          style={{ 
            backgroundColor: '#F9FAFC',
            border: 'none',
            outline: 'none',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Botón de cerrar */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <DrawerHeader className="pt-16 pb-4">
            <div className="text-center">
              {/* Logo circular centrado */}
              <div className="mx-auto mb-4">
                <div 
                  className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-white bg-cover bg-center mx-auto"
                  style={{ backgroundImage: `url(${restaurant.logo_url || getRestaurantImage(restaurant)})` }}
                />
              </div>
              
              {/* Título centrado */}
              <DrawerTitle className="text-xl font-bold text-gray-900 mb-3">
                {restaurant.name}
              </DrawerTitle>
              
              {/* Rating y reseñas centradas */}
              <div className="flex items-center justify-center mb-3">
                <ReviewsSection 
                  rating={restaurant.rating || 4.7} 
                  reviewCount={restaurant.review_count || 50} 
                />
              </div>
              
              {restaurant.description && (
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  {restaurant.description}
                </p>
              )}
            </div>
            <DrawerDescription className="sr-only">
              Productos y menú de {restaurant.name}
            </DrawerDescription>
          </DrawerHeader>

          {/* Tabs de navegación con componente Shadcn */}
          <div className="flex-1 flex flex-col">
            <Tabs defaultValue="todos" value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="flex flex-col h-full">
              <div className="px-6 pb-4">
                <TabsList className="grid w-full grid-cols-3 h-10 md:h-8">
                  <TabsTrigger value="todos" className="flex items-center gap-2 text-base md:text-sm">
                    <Grid3X3 className="w-4 h-4" />
                    Todos
                  </TabsTrigger>
                  <TabsTrigger value="popular" className="flex items-center gap-2 text-base md:text-sm">
                    <TrendingUp className="w-4 h-4" />
                    Popular
                  </TabsTrigger>
                  <TabsTrigger value="ofertas" className="flex items-center gap-2 text-base md:text-sm">
                    <Tag className="w-4 h-4" />
                    Ofertas
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content - Lista de productos */}
              <div className="flex-1 overflow-hidden">
                <TabsContent value="todos" className="h-full overflow-y-auto px-6 mt-0 animate-in fade-in slide-in-from-right-2 duration-300">
                  <ProductsContent
                    loadingProducts={loadingProducts}
                    filteredProducts={filteredProducts}
                    activeTab={activeTab}
                    productQuantities={productQuantities}
                    onQuantityChange={onQuantityChange}
                    loadingProductId={loadingProductId}
                    currency={currency}
                    getProductImage={getProductImage}
                    handleProductClick={handleProductClick}
                  />
                </TabsContent>
                
                <TabsContent value="popular" className="h-full overflow-y-auto px-6 mt-0 animate-in fade-in slide-in-from-right-2 duration-300">
                  <ProductsContent
                    loadingProducts={loadingProducts}
                    filteredProducts={filteredProducts}
                    activeTab={activeTab}
                    productQuantities={productQuantities}
                    onQuantityChange={onQuantityChange}
                    loadingProductId={loadingProductId}
                    currency={currency}
                    getProductImage={getProductImage}
                    handleProductClick={handleProductClick}
                  />
                </TabsContent>
                
                <TabsContent value="ofertas" className="h-full overflow-y-auto px-6 mt-0 animate-in fade-in slide-in-from-right-2 duration-300">
                  <ProductsContent
                    loadingProducts={loadingProducts}
                    filteredProducts={filteredProducts}
                    activeTab={activeTab}
                    productQuantities={productQuantities}
                    onQuantityChange={onQuantityChange}
                    loadingProductId={loadingProductId}
                    currency={currency}
                    getProductImage={getProductImage}
                    handleProductClick={handleProductClick}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        open={showProductDetail}
        onOpenChange={setShowProductDetail}
        product={selectedProduct}
        initialQuantity={selectedProduct ? (productQuantities[selectedProduct.id] || 0) : 0}
        onQuantityChange={onQuantityChange}
        currency={currency}
        getProductImage={getProductImage}
        loading={selectedProduct ? loadingProductId === selectedProduct.id : false}
      />
    </>
  )
}