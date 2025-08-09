'use client'

import { Bell, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BottomNavigation } from '@/components/app/mobile/bottom-navigation'

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header móvil */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold text-gray-900">LlaneroBodegón</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Navegación inferior */}
      <BottomNavigation />
    </div>
  )
}