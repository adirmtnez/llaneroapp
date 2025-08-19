'use client'

import { Clock, Package, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const mockRecentOrders = [
  {
    id: 'PED-001',
    bodegon: 'Bodegón Central',
    status: 'delivered',
    total: 27.50,
    date: 'Hoy, 14:30',
    items: 3
  },
  {
    id: 'PED-002',
    bodegon: 'La Esquina Sabrosa',
    status: 'delivered',
    total: 15.00,
    date: 'Ayer, 19:15',
    items: 2
  },
  {
    id: 'PED-003',
    bodegon: 'Bodegón Express',
    status: 'in_progress',
    total: 32.75,
    date: 'Hace 2 días',
    items: 5
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'in_progress':
      return <Package className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'Entregado'
    case 'in_progress':
      return 'En camino'
    default:
      return 'Pendiente'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-700 border-green-200'
    case 'in_progress':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

interface RecentOrdersProps {
  onViewAllOrders?: () => void
}

export function RecentOrders({ onViewAllOrders }: RecentOrdersProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900 flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Pedidos Recientes</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockRecentOrders.map((order) => (
          <div key={order.id} className="p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span className="font-medium text-sm text-gray-900">
                  {order.bodegon}
                </span>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${getStatusColor(order.status)}`}
              >
                {getStatusLabel(order.status)}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="space-y-1">
                <p>{order.date}</p>
                <p className="text-gray-500">
                  {order.items} {order.items === 1 ? 'producto' : 'productos'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-orange-600">
                  ${order.total.toFixed(2)}
                </p>
                <p className="text-gray-500">#{order.id}</p>
              </div>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-xl h-9 text-sm border-gray-200 hover:bg-gray-50"
          onClick={onViewAllOrders}
        >
          Ver todos los pedidos
        </Button>
      </CardContent>
    </Card>
  )
}