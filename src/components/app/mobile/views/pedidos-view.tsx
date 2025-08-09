'use client'

import { useState } from 'react'
import { Clock, MapPin, Package, CheckCircle, XCircle, Truck, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data para pedidos activos
const activePedidos = [
  {
    id: 'PED-001',
    bodegon: 'Bodegón Central',
    status: 'preparing',
    statusText: 'Preparando',
    estimatedTime: '15-20 min',
    items: [
      { name: 'Hamburguesa Clásica', quantity: 2, price: 'Bs. 24.00' },
      { name: 'Coca Cola 350ml', quantity: 1, price: 'Bs. 3.50' }
    ],
    total: 'Bs. 27.50',
    orderTime: '14:30',
    deliveryAddress: 'Av. Principal #123, Caracas'
  },
  {
    id: 'PED-002',
    bodegon: 'La Esquina Sabrosa',
    status: 'on_way',
    statusText: 'En camino',
    estimatedTime: '5-10 min',
    items: [
      { name: 'Papas Fritas', quantity: 1, price: 'Bs. 8.00' },
      { name: 'Refresco', quantity: 2, price: 'Bs. 7.00' }
    ],
    total: 'Bs. 15.00',
    orderTime: '15:45',
    deliveryAddress: 'Centro Comercial, Piso 3'
  }
]

// Mock data para historial de pedidos
const historialPedidos = [
  {
    id: 'PED-003',
    bodegon: 'Bodegón Express',
    status: 'delivered',
    statusText: 'Entregado',
    items: [
      { name: 'Sandwich Mixto', quantity: 1, price: 'Bs. 10.00' },
      { name: 'Jugo Natural', quantity: 1, price: 'Bs. 5.00' }
    ],
    total: 'Bs. 15.00',
    orderDate: '2024-01-15',
    orderTime: '12:30',
    rating: 5
  },
  {
    id: 'PED-004',
    bodegon: 'Bodegón Central',
    status: 'delivered',
    statusText: 'Entregado',
    items: [
      { name: 'Pizza Personal', quantity: 1, price: 'Bs. 18.00' },
      { name: 'Coca Cola 600ml', quantity: 1, price: 'Bs. 5.00' }
    ],
    total: 'Bs. 23.00',
    orderDate: '2024-01-14',
    orderTime: '19:15',
    rating: 4
  },
  {
    id: 'PED-005',
    bodegon: 'La Esquina Sabrosa',
    status: 'cancelled',
    statusText: 'Cancelado',
    items: [
      { name: 'Empanadas', quantity: 3, price: 'Bs. 9.00' }
    ],
    total: 'Bs. 9.00',
    orderDate: '2024-01-13',
    orderTime: '16:20',
    rating: null
  }
]

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'preparing':
      return <Clock className="h-5 w-5 text-orange-500" />
    case 'on_way':
      return <Truck className="h-5 w-5 text-blue-500" />
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-500" />
    default:
      return <Package className="h-5 w-5 text-gray-500" />
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'preparing':
      return 'bg-orange-100 text-orange-600'
    case 'on_way':
      return 'bg-blue-100 text-blue-600'
    case 'delivered':
      return 'bg-green-100 text-green-600'
    case 'cancelled':
      return 'bg-red-100 text-red-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

export function PedidosView() {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <Button
            variant={activeTab === 'active' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 rounded-md"
            onClick={() => setActiveTab('active')}
          >
            Activos ({activePedidos.length})
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            className="flex-1 rounded-md"
            onClick={() => setActiveTab('history')}
          >
            Historial
          </Button>
        </div>
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'active' ? (
        /* Pedidos activos */
        <div className="space-y-4">
          {activePedidos.length > 0 ? (
            activePedidos.map((pedido) => (
              <Card key={pedido.id} className="border-gray-200">
                <CardContent className="p-4 space-y-4">
                  {/* Header del pedido */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(pedido.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900">{pedido.bodegon}</h3>
                        <p className="text-sm text-gray-500">Pedido #{pedido.id}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(pedido.status)}>
                      {pedido.statusText}
                    </Badge>
                  </div>

                  {/* Tiempo estimado */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Tiempo estimado: {pedido.estimatedTime}
                        </span>
                      </div>
                      <span className="text-xs text-blue-600">Pedido a las {pedido.orderTime}</span>
                    </div>
                  </div>

                  {/* Items del pedido */}
                  <div className="space-y-2">
                    {pedido.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-medium text-gray-900">{item.price}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex items-center justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-blue-600">{pedido.total}</span>
                    </div>
                  </div>

                  {/* Dirección de entrega */}
                  <div className="flex items-start space-x-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{pedido.deliveryAddress}</span>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Rastrear Pedido
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      Contactar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pedidos activos</h3>
              <p className="text-gray-500 mb-4">¡Haz tu primer pedido y disfruta!</p>
              <Button>Explorar Bodegones</Button>
            </div>
          )}
        </div>
      ) : (
        /* Historial de pedidos */
        <div className="space-y-4">
          {historialPedidos.map((pedido) => (
            <Card key={pedido.id} className="border-gray-200">
              <CardContent className="p-4 space-y-3">
                {/* Header del pedido */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(pedido.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{pedido.bodegon}</h3>
                      <p className="text-sm text-gray-500">
                        {pedido.orderDate} • {pedido.orderTime}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(pedido.status)}>
                    {pedido.statusText}
                  </Badge>
                </div>

                {/* Items del pedido */}
                <div className="space-y-1">
                  {pedido.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium text-gray-900">{item.price}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">{pedido.total}</span>
                  </div>
                </div>

                {/* Rating y acciones */}
                <div className="flex items-center justify-between pt-2">
                  {pedido.rating ? (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{pedido.rating}/5</span>
                    </div>
                  ) : (
                    <div></div>
                  )}
                  
                  <div className="flex space-x-2">
                    {pedido.status === 'delivered' && (
                      <Button variant="outline" size="sm">
                        Pedir de Nuevo
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}