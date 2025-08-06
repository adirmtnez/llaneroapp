'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  Store,
  Building2,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Package,
  Tags,
  Hash
} from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: Home
  },
  {
    id: 'bodegones',
    label: 'Bodegones',
    icon: Store,
    children: [
      { id: 'bodegones-localidades', label: 'Localidades', icon: MapPin },
      { id: 'bodegones-pedidos', label: 'Pedidos', icon: ShoppingBag },
      { id: 'bodegones-productos', label: 'Productos', icon: Package },
      { id: 'bodegones-categorias', label: 'Categorías', icon: Tags },
      { id: 'bodegones-subcategorias', label: 'Subcategorías', icon: Hash }
    ]
  },
  {
    id: 'restaurantes',
    label: 'Restaurantes',
    icon: Building2,
    children: [
      { id: 'restaurantes-localidades', label: 'Localidades', icon: MapPin },
      { id: 'restaurantes-pedidos', label: 'Pedidos', icon: ShoppingBag },
      { id: 'restaurantes-productos', label: 'Productos', icon: Package },
      { id: 'restaurantes-categorias', label: 'Categorías', icon: Tags },
      { id: 'restaurantes-subcategorias', label: 'Subcategorías', icon: Hash }
    ]
  },
  {
    id: 'repartidores',
    label: 'Repartidores',
    icon: UserCheck
  },
  {
    id: 'equipo',
    label: 'Equipo',
    icon: Users
  },
  {
    id: 'metodos-pago',
    label: 'Métodos de Pago',
    icon: CreditCard
  },
  {
    id: 'configuraciones',
    label: 'Configuraciones',
    icon: Settings
  }
]

interface SidebarProps {
  currentView?: string
  onViewChange?: (viewId: string) => void
}

export function Sidebar({ currentView = 'inicio', onViewChange }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['bodegones', 'restaurantes'])

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleItemClick = (itemId: string) => {
    onViewChange?.(itemId)
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => (
            <li key={item.id}>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    if (item.children) {
                      toggleExpanded(item.id)
                    } else {
                      handleItemClick(item.id)
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    currentView === item.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  
                  {item.children && (
                    expandedItems.includes(item.id) 
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                {item.children && expandedItems.includes(item.id) && (
                  <ul className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => handleItemClick(child.id)}
                          className={cn(
                            "w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors",
                            currentView === child.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          )}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}