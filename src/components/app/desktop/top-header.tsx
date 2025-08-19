'use client'

import { Search, Bell, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/auth-context'

interface TopHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export function TopHeader({ searchQuery, onSearchChange }: TopHeaderProps) {
  const { user, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png" 
              alt="Llanero" 
              className="h-8 w-auto"
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 w-full h-10 rounded-2xl border-gray-200 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-5 w-5 text-gray-600" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-10 w-10 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="h-5 w-5 text-gray-600" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.auth_user?.email || ''} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-sm">
                  {user?.auth_user?.email?.charAt(0).toUpperCase() || user?.profile?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              {user ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Salir
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Iniciar Sesión
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}