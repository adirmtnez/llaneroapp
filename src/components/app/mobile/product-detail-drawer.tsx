'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface ProductDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: {
    id: string | number
    name: string
    description?: string
    price: number
    image_url?: string
    image_gallery_urls?: string[]
    size?: string
    volume?: string
  } | null
  initialQuantity?: number
  onQuantityChange?: (productId: string | number, quantity: number) => void
  currency?: string
  getProductImage?: (product: any) => string
  loading?: boolean
}

export function ProductDetailDrawer({
  open,
  onOpenChange,
  product,
  initialQuantity = 0,
  onQuantityChange,
  currency = '$',
  getProductImage,
  loading = false
}: ProductDetailDrawerProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  // 🔄 Sincronizar estado interno cuando cambie initialQuantity
  // Esto asegura que el drawer se actualice correctamente con el estado del carrito
  useEffect(() => {
    setQuantity(initialQuantity)
  }, [initialQuantity])

  if (!product) return null

  const handleDecrease = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1
      // ❌ NO actualizar estado local inmediatamente
      // setQuantity(newQuantity) - Esto se hará solo si la operación es exitosa
      onQuantityChange?.(product.id, newQuantity)
    }
  }

  const handleIncrease = () => {
    const newQuantity = quantity + 1
    // ❌ NO actualizar estado local inmediatamente
    // setQuantity(newQuantity) - Esto se hará solo si la operación es exitosa
    onQuantityChange?.(product.id, newQuantity)
  }

  const handleAddToCart = () => {
    const newQuantity = 1
    // ❌ NO actualizar estado local inmediatamente
    // setQuantity(newQuantity) - Esto se hará solo si la operación es exitosa
    onQuantityChange?.(product.id, newQuantity)
  }

  const productImage = getProductImage ? getProductImage(product) : (
    product.image_gallery_urls?.[0] || 
    product.image_url || 
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
  )

  const productDescription = product.description || `${product.size || ''} ${product.volume || ''}`.trim()

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[90vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
        <DrawerHeader className="text-left pb-4">
          <DrawerTitle className="sr-only">{product.name}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Detalles del producto {product.name}
          </DrawerDescription>
        </DrawerHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="space-y-6">
            {/* Imagen del producto */}
            <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden w-64 mx-auto">
              <img
                src={productImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&h=400&fit=crop&crop=center'
                }}
              />
            </div>

            {/* Información del producto */}
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                {productDescription && (
                  <p className="text-gray-600 text-base leading-relaxed">
                    {productDescription}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <span className="text-3xl font-bold text-gray-900">
                  {currency}{product.price?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer sticky */}
        <div className="border-t bg-white p-6 mt-auto">
          <div className="flex items-center gap-4">
            {/* Contador a la izquierda (siempre visible cuando hay cantidad) */}
            {quantity > 0 && (
              <div className="flex items-center bg-orange-600 rounded-full h-12 px-2 min-w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full bg-white hover:bg-gray-50 hover:scale-110 text-orange-600 p-0 transition-all duration-150 active:scale-95"
                  onClick={handleDecrease}
                  disabled={loading}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                
                <span className="flex-1 text-center text-white font-semibold text-lg transition-all duration-200">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    quantity
                  )}
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full bg-white hover:bg-gray-50 hover:scale-110 text-orange-600 p-0 transition-all duration-150 active:scale-95"
                  onClick={handleIncrease}
                  disabled={loading}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Botón principal a la derecha */}
            <Button
              size="lg"
              className="flex-1 h-12 hover:scale-105 rounded-full font-semibold text-base transition-all duration-200 active:scale-95"
              style={{ backgroundColor: '#F5E9E3', color: '#ea580c' }}
              onClick={quantity > 0 ? handleIncrease : handleAddToCart}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando...</span>
                </div>
              ) : (
                quantity > 0 ? 'Actualizar' : 'Agregar al Carrito'
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}