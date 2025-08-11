'use client'

import { useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Tag, BadgePercent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface CartItem {
  id: string | number
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cartItems: CartItem[]
  onQuantityChange: (productId: string | number, quantity: number) => void
  onRemoveItem: (productId: string | number) => void
  onClearCart: () => void
  onNavigateToCheckout?: () => void
  currency?: string
}

export function CartDrawer({
  open,
  onOpenChange,
  cartItems,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  onNavigateToCheckout,
  currency = '$'
}: CartDrawerProps) {
  // Estado del cupón
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null)
  const [couponError, setCouponError] = useState('')
  
  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 50 ? 0 : 5 // Envío gratis para pedidos >$50
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0
  const total = subtotal + shipping - couponDiscount

  const handleQuantityChange = (productId: string | number, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId)
    } else {
      onQuantityChange(productId, newQuantity)
    }
  }

  // Función para aplicar cupón (mock - reemplazar con lógica real)
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return

    // Mock de cupones válidos
    const validCoupons = [
      { code: 'DESCUENTO10', discount: subtotal * 0.1 }, // 10% descuento
      { code: 'ENVIOGRATIS', discount: shipping }, // Envío gratis
      { code: 'BIENVENIDO', discount: 5 }, // $5 descuento fijo
    ]

    const coupon = validCoupons.find(c => c.code.toLowerCase() === couponCode.toLowerCase())
    
    if (coupon) {
      setAppliedCoupon(coupon)
      setCouponError('')
      setCouponCode('')
    } else {
      setCouponError('Cupón no válido o expirado')
      setAppliedCoupon(null)
    }
  }

  // Remover cupón aplicado
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponError('')
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[85vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
        <DrawerHeader className="text-left pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <span>Mi Carrito ({cartItems.length})</span>
            </DrawerTitle>
            
            {cartItems.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-red-50 text-red-500 hover:text-red-600"
                onClick={onClearCart}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DrawerDescription className="sr-only">
            Lista de productos en el carrito de compras
          </DrawerDescription>
        </DrawerHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6">
          {cartItems.length > 0 ? (
            <div className="space-y-4 pb-6">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-[20px] p-4 border border-gray-100 shadow-sm">
                  {/* Layout de 2 columnas */}
                  <div className="flex space-x-4">
                    {/* Columna 1: Imagen del producto */}
                    <div className="w-16 h-16 bg-gray-100 rounded-[15px] overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Columna 2: Todo el contenido */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      {/* Título del producto */}
                      <div className="mb-2">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {item.name}
                        </h3>
                      </div>

                      {/* Controles agrupados - precio junto a botones */}
                      <div className="flex justify-end items-center space-x-2">
                        {/* Precio */}
                        <span className="font-semibold text-sm text-gray-900">
                          {currency}{item.price.toFixed(2)}
                        </span>
                        
                        {/* Selector de cantidad más pequeño */}
                        <div className="flex items-center bg-orange-600 rounded-full h-8 px-1 min-w-[80px]">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          
                          <span className="flex-1 text-center text-white font-medium text-xs">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Botón eliminar más pequeño */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 p-0"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                <p className="text-gray-400 text-sm mt-1">Agrega productos para continuar</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer sticky con resumen */}
        {cartItems.length > 0 && (
          <div className="border-t px-6 py-4 mt-auto" style={{ backgroundColor: 'white' }}>
            {/* Resumen de precios */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Subtotal</span>
                <span className="font-medium text-gray-900">{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Envío</span>
                <span className="font-medium text-gray-900">
                  {shipping === 0 ? 'Gratis' : `${currency}${shipping.toFixed(2)}`}
                </span>
              </div>
              
              {/* Mostrar descuento si hay cupón aplicado */}
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600">
                  <div className="flex items-center space-x-1">
                    <Tag className="h-3 w-3" />
                    <span className="text-sm font-medium">{appliedCoupon.code}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-medium">-{currency}{couponDiscount.toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-red-50 text-red-500 hover:text-red-600"
                      onClick={handleRemoveCoupon}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Sección de cupón */}
            <div className="mb-4">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  {/* Icono dentro del input */}
                  <BadgePercent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  
                  <Input
                    placeholder="Código de cupón"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value)
                      setCouponError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleApplyCoupon()
                      }
                    }}
                    className="h-11 md:h-9 text-base md:text-sm rounded-full border-gray-200 focus:border-orange-300 focus:ring-orange-200 pl-10 bg-white"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 md:h-9 text-base md:text-sm rounded-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim()}
                >
                  Aplicar
                </Button>
              </div>
              
              {/* Error del cupón */}
              {couponError && (
                <p className="text-red-500 text-xs mt-1 px-2">{couponError}</p>
              )}
            </div>

            {/* Botón ir a pagar */}
            <Button
              className="w-full h-11 md:h-10 text-base md:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
              onClick={() => {
                onOpenChange(false) // Cerrar carrito
                onNavigateToCheckout?.() // Navegar a checkout
              }}
            >
              Ir a Pagar
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  )
}