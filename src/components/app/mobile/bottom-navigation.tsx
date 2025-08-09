'use client'

import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigationItems = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: Home
  },
  {
    id: 'buscar',
    label: 'Buscar',
    icon: Search
  },
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ShoppingBag
  },
  {
    id: 'cuenta',
    label: 'Cuenta',
    icon: User
  }
]

interface BottomNavigationProps {
  currentView: string
  onViewChange: (view: string) => void
}

export function BottomNavigation({ currentView, onViewChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 rounded-t-3xl shadow-lg z-50">
      <div className="flex items-center justify-around py-2 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={`flex flex-col items-center space-y-1 h-auto py-2 px-3 transition-colors ${
                isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}