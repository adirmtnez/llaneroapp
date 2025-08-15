'use client'

import { Bell, AlertCircle } from 'lucide-react'
import { MenuDrawer } from '../menu-drawer'

interface NotificationsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsDrawer({ open, onOpenChange }: NotificationsDrawerProps) {
  return (
    <MenuDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Notificaciones"
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
            Configura tus preferencias de notificaciones: pedidos, ofertas, nuevos productos y más. Personaliza tu experiencia.
          </p>
        </div>
        
        <div className="mt-6 p-4 bg-orange-50 rounded-lg">
          <p className="text-xs text-orange-700 text-center">
            🔔 Centro de notificaciones y preferencias en construcción
          </p>
        </div>
      </div>
    </MenuDrawer>
  )
}