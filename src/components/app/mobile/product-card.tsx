'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ProductCardProps {
  id: string | number
  name: string
  description?: string
  price: number
  image: string
  initialQuantity?: number
  onQuantityChange?: (id: string | number, quantity: number) => void
  currency?: string
}

export function ProductCard({
  id,
  name,
  description,
  price,
  image,
  initialQuantity = 0,
  onQuantityChange,
  currency = '$'
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const handleDecrease = () => {
    if (quantity > 0) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onQuantityChange?.(id, newQuantity)
    }
  }

  const handleIncrease = () => {
    const newQuantity = quantity + 1
    setQuantity(newQuantity)
    onQuantityChange?.(id, newQuantity)
  }

  const handleAddToCart = () => {
    const newQuantity = 1
    setQuantity(newQuantity)
    onQuantityChange?.(id, newQuantity)
  }

  return (
    <Card className="overflow-hidden bg-white rounded-2xl shadow-none">
      <div className="p-4 space-y-3">
        {/* Image */}
        <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2">
            {name}
          </h3>
          
          {description && (
            <p className="text-xs text-gray-500 line-clamp-1">
              {description}
            </p>
          )}

          <p className="font-bold text-lg text-gray-900">
            {currency}{price.toFixed(2)}
          </p>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center justify-center">
          {quantity > 0 ? (
            <div className="flex items-center bg-orange-600 rounded-full h-10 px-1 min-w-[120px]">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                onClick={handleDecrease}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span className="flex-1 text-center text-white font-medium text-sm">
                {quantity}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full bg-white hover:bg-gray-50 text-orange-600 p-0"
                onClick={handleIncrease}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full"
              onClick={handleAddToCart}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}