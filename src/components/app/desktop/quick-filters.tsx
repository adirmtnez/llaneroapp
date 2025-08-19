'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const categories = [
  { id: 'all', name: 'Todos los productos', icon: '🏪', count: 45 },
  { id: 'snacks', name: 'Snacks', icon: '🍿', count: 15 },
  { id: 'rones', name: 'Rones', icon: '🥃', count: 8 },
  { id: 'mercado', name: 'Mercado', icon: '🛒', count: 12 },
  { id: 'bebidas', name: 'Bebidas', icon: '🥤', count: 6 },
  { id: 'dulces', name: 'Dulces', icon: '🍭', count: 4 }
]

interface QuickFiltersProps {
  selectedCategory: string
  onCategoryChange: (categoryId: string) => void
}

export function QuickFilters({ selectedCategory, onCategoryChange }: QuickFiltersProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900">Filtros Rápidos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'ghost'}
            className={`w-full justify-between h-auto py-3 px-3 transition-colors ${
              selectedCategory === category.id 
                ? 'bg-orange-600 text-white hover:bg-orange-700' 
                : 'hover:bg-gray-50 text-gray-700'
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </div>
            <Badge 
              variant={selectedCategory === category.id ? 'secondary' : 'outline'} 
              className={`text-xs ${
                selectedCategory === category.id 
                  ? 'bg-white/20 text-white border-white/30' 
                  : 'text-gray-500'
              }`}
            >
              {category.count}
            </Badge>
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}