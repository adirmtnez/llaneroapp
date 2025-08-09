'use client'

import { Tag, AlertCircle } from 'lucide-react'
import { MenuDrawer } from '../menu-drawer'

interface CouponsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CouponsDrawer({ open, onOpenChange }: CouponsDrawerProps) {
  return (
    <MenuDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Cupones"
      icon={<Tag className="h-5 w-5 text-orange-600" />}
    >
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-orange-600" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            En desarrollo
          </h3>
          <p className="text-gray-600 text-sm max-w-xs">
            Estamos preparando un sistema de cupones y descuentos exclusivos. Podrás canjear códigos promocionales y ver tus ofertas disponibles.
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-700 text-center">
            🎫 Sistema de cupones y promociones en construcción
          </p>
        </div>
      </div>
    </MenuDrawer>
  )
}