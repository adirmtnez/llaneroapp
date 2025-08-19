'use client'

import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

const navigationTabs = [
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

interface TabNavigationProps {
  currentTab: string
  onTabChange: (tab: string) => void
}

export function TabNavigation({ currentTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = currentTab === tab.id
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex items-center space-x-2 h-12 px-4 transition-colors border-b-2 border-transparent hover:bg-gray-50 ${
                  isActive 
                    ? 'text-orange-600 border-orange-600 bg-orange-50' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon 
                  className={`${isActive ? 'text-orange-600' : 'text-gray-500'}`}
                  size={20}
                />
                <span className={`font-medium ${
                  isActive ? 'text-orange-600' : 'text-gray-600'
                }`}>
                  {tab.label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}