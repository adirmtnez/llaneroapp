'use client'

import { ShoppingCart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface CartSummaryProps {
  cartItems?: any[]
  onViewCart?: () => void
  onCheckout?: () => void
}

export function CartSummary({ cartItems = [], onViewCart, onCheckout }: CartSummaryProps) {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  if (totalItems === 0) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-900 flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Mi Carrito</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🛒</div>
            <p className="text-sm text-gray-500">Tu carrito está vacío</p>
            <p className="text-xs text-gray-400 mt-1">
              Agrega productos para comenzar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Mi Carrito</span>
          </div>
          <span className="text-sm font-normal text-orange-600">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini lista de productos */}
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {cartItems.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-xs">{item.quantity}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 truncate font-medium">{item.name}</p>
              </div>
              <p className="text-gray-600 font-medium">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
          
          {cartItems.length > 3 && (
            <p className="text-xs text-gray-500 text-center py-1">
              +{cartItems.length - 3} productos más
            </p>
          )}
        </div>

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Total:</span>
          <span className="font-bold text-lg text-orange-600">
            ${totalPrice.toFixed(2)}
          </span>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          <Button 
            onClick={onCheckout}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10"
          >
            <span>Proceder al Checkout</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onViewCart}
            className="w-full rounded-xl h-9 text-sm border-gray-200 hover:bg-gray-50"
          >
            Ver carrito completo
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}