'use client'

import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  currency?: string
}

export function CartDrawer({
  open,
  onOpenChange,
  cartItems,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  currency = '$'
}: CartDrawerProps) {
  // Calcular totales
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = subtotal > 50 ? 0 : 5 // Envío gratis para pedidos >$50
  const total = subtotal + shipping

  const handleQuantityChange = (productId: string | number, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(productId)
    } else {
      onQuantityChange(productId, newQuantity)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[85vh]" style={{ backgroundColor: '#F9FAFC' }}>
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
                  <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
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

                    {/* Info del producto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 truncate">
                        {item.name}
                      </h3>
                      <p className="font-semibold text-base text-gray-900 mt-1">
                        {currency}{item.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex items-center space-x-2">
                      {/* Selector de cantidad */}
                      <div className="flex items-center bg-orange-600 rounded-full h-10 px-1 min-w-[100px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        
                        <span className="flex-1 text-center text-white font-medium text-sm">
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Botón eliminar */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 rounded-full hover:bg-red-50 text-red-500 hover:text-red-600 p-0"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-lg text-gray-900">{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón ir a pagar */}
            <Button
              size="lg"
              className="w-full h-12 rounded-full font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
              style={{ backgroundColor: '#F5E9E3', color: '#ea580c' }}
              onClick={() => {
                // TODO: Implementar navegación a checkout
                console.log('Ir a pagar')
                onOpenChange(false)
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