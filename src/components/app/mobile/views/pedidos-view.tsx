'use client'

import React, { useState } from 'react'
import { Package, Clock, CheckCircle, Truck, ChevronRight, Smartphone, Landmark, Globe, ArrowLeft, FileText, User, Phone, MapPin, MessageCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// Interfaces
interface Pedido {
  id: string
  numero: string
  total: number
  estado: 'procesando' | 'preparando' | 'enviado' | 'entregado'
  metodo_pago: 'pago_movil' | 'transferencia_bancaria' | 'cuenta_internacional'
  fecha_pedido: string
  hora_pedido: string
  bodegon_nombre: string
  productos?: ProductoPedido[]
  envio?: number
  subtotal?: number
}

interface ProductoPedido {
  id: string
  nombre: string
  cantidad: number
  precio: number
  total: number
}

interface Repartidor {
  nombre: string
  telefono: string
  metodo_pago: string
}

interface BodegonContacto {
  nombre: string
  direccion: string
  telefono: string
}

// Mock data para pedidos
const mockPedidosPendientes: Pedido[] = [
  {
    id: '1',
    numero: 'TEZ7ATAQ4D',
    total: 300.00,
    estado: 'preparando',
    metodo_pago: 'pago_movil',
    fecha_pedido: '2023-07-03',
    hora_pedido: '15:03',
    bodegon_nombre: 'Bodegón Central',
    subtotal: 280.00,
    envio: 20.00,
    productos: [
      {
        id: '1',
        nombre: 'Hamburguesa Premium',
        cantidad: 2,
        precio: 85.00,
        total: 170.00
      },
      {
        id: '2',
        nombre: 'Papas Fritas Grande',
        cantidad: 1,
        precio: 45.00,
        total: 45.00
      },
      {
        id: '3',
        nombre: 'Coca Cola 350ml',
        cantidad: 2,
        precio: 32.50,
        total: 65.00
      }
    ]
  },
  {
    id: '2',
    numero: 'TETDZR3PA6',
    total: 450.00,
    estado: 'procesando',
    metodo_pago: 'transferencia_bancaria',
    fecha_pedido: '2023-07-03',
    hora_pedido: '14:30',
    bodegon_nombre: 'Bodegón Norte',
    subtotal: 430.00,
    envio: 20.00,
    productos: [
      {
        id: '4',
        nombre: 'Pizza Familiar',
        cantidad: 1,
        precio: 320.00,
        total: 320.00
      },
      {
        id: '5',
        nombre: 'Refresco 2L',
        cantidad: 2,
        precio: 55.00,
        total: 110.00
      }
    ]
  }
]

const mockPedidosEntregados: Pedido[] = [
  {
    id: '3',
    numero: 'CERVEZA001',
    total: 120.00,
    estado: 'entregado',
    metodo_pago: 'pago_movil',
    fecha_pedido: '2023-06-24',
    hora_pedido: '17:17',
    bodegon_nombre: 'Bodegón Sur',
    subtotal: 100.00,
    envio: 20.00,
    productos: [
      {
        id: '6',
        nombre: 'Cerveza Premium 355ml',
        cantidad: 6,
        precio: 16.67,
        total: 100.00
      }
    ]
  },
  {
    id: '4',
    numero: 'TC9Y6PYZE4',
    total: 1000.00,
    estado: 'entregado',
    metodo_pago: 'transferencia_bancaria',
    fecha_pedido: '2023-06-24',
    hora_pedido: '16:45',
    bodegon_nombre: 'Bodegón Este',
    subtotal: 980.00,
    envio: 20.00,
    productos: [
      {
        id: '7',
        nombre: 'Parrilla Familiar',
        cantidad: 1,
        precio: 650.00,
        total: 650.00
      },
      {
        id: '8',
        nombre: 'Ensalada César',
        cantidad: 2,
        precio: 120.00,
        total: 240.00
      },
      {
        id: '9',
        nombre: 'Jugo Natural',
        cantidad: 3,
        precio: 30.00,
        total: 90.00
      }
    ]
  }
]

function getEstadoConfig(estado: Pedido['estado']) {
  switch (estado) {
    case 'procesando':
      return {
        label: 'Procesando',
        badgeColor: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
      }
    case 'preparando':
      return {
        label: 'Preparando',
        badgeColor: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
      }
    case 'enviado':
      return {
        label: 'Enviado',
        badgeColor: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      }
    case 'entregado':
      return {
        label: 'Entregado',
        badgeColor: 'bg-green-100 text-green-700 hover:bg-green-100'
      }
  }
}

function getMetodoPagoIcon(metodo: Pedido['metodo_pago']) {
  switch (metodo) {
    case 'pago_movil':
      return Smartphone
    case 'transferencia_bancaria':
      return Landmark
    case 'cuenta_internacional':
      return Globe
  }
}

function formatFecha(fecha: string) {
  const date = parseISO(fecha)
  
  if (isToday(date)) {
    return 'Hoy'
  } else if (isYesterday(date)) {
    return 'Ayer'
  } else {
    return format(date, "d 'de' MMM. 'de' yyyy", { locale: es })
  }
}

export function PedidosView() {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'entregados'>('pendientes')
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [showPedidoModal, setShowPedidoModal] = useState(false)
  const [showDetallesEnvio, setShowDetallesEnvio] = useState(false)

  // Mock data para repartidor y bodegón
  const getMockRepartidor = (pedido: Pedido): Repartidor => ({
    nombre: "Carlos Rodríguez",
    telefono: "+58 414 5446784",
    metodo_pago: pedido.metodo_pago
  })

  const getMockBodegon = (pedido: Pedido): BodegonContacto => ({
    nombre: pedido.bodegon_nombre,
    direccion: "Av. Principal #456, Centro Comercial Plaza, Local 23",
    telefono: "+58 212 1234567"
  })

  const getCurrentPedidos = () => {
    return activeTab === 'pendientes' ? mockPedidosPendientes : mockPedidosEntregados
  }

  const renderPedidosList = () => {
    const pedidos = getCurrentPedidos()

    if (pedidos.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          {activeTab === 'pendientes' ? (
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-orange-50 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sin pedidos pendientes
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Cuando realices un pedido, aparecerá aquí para que puedas seguir su progreso.
              </p>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-50 rounded-full flex items-center justify-center">
                <Package className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Sin pedidos entregados
              </h3>
              <p className="text-gray-500 leading-relaxed">
                Tu historial de pedidos completados se mostrará en esta sección.
              </p>
            </div>
          )}
        </div>
      )
    }

    // Agrupar pedidos por fecha
    const pedidosAgrupados = pedidos.reduce((acc, pedido) => {
      const fecha = pedido.fecha_pedido
      if (!acc[fecha]) {
        acc[fecha] = []
      }
      acc[fecha].push(pedido)
      return acc
    }, {} as Record<string, Pedido[]>)

    // Ordenar fechas (más recientes primero)
    const fechasOrdenadas = Object.keys(pedidosAgrupados).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )

    return (
      <div className="space-y-6">
        {fechasOrdenadas.map(fecha => (
          <div key={fecha} className="space-y-4">
            {/* Separador de fecha */}
            <h3 className="text-sm font-medium text-gray-500 px-1">
              {formatFecha(fecha)}
            </h3>
            
            {/* Pedidos de esta fecha */}
            <div className="space-y-2">
              {pedidosAgrupados[fecha].map(pedido => {
                const estadoConfig = getEstadoConfig(pedido.estado)
                const MetodoPagoIcon = getMetodoPagoIcon(pedido.metodo_pago)
                
                return (
                  <Card 
                    key={pedido.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedPedido(pedido)
                      setShowPedidoModal(true)
                    }}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center space-x-3">
                          {/* Icono de método de pago */}
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                            <MetodoPagoIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          
                          {/* Info del pedido */}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {pedido.numero}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs border-0", estadoConfig.badgeColor)}>
                                {estadoConfig.label}
                              </Badge>
                              <span className="text-gray-400">•</span>
                              <p className="text-xs text-gray-500">
                                {pedido.hora_pedido}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Monto y chevron */}
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            ${pedido.total.toFixed(2)}
                          </p>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderDetallesEnvioDrawer = () => {
    if (!selectedPedido) return null

    const repartidor = getMockRepartidor(selectedPedido)
    const bodegon = getMockBodegon(selectedPedido)
    const metodoPagoText = selectedPedido.metodo_pago === 'pago_movil' ? 'Pago móvil' : 
                          selectedPedido.metodo_pago === 'transferencia_bancaria' ? 'Transferencia bancaria' : 
                          'Cuenta internacional'

    return (
      <Drawer open={showDetallesEnvio} onOpenChange={setShowDetallesEnvio}>
        <DrawerContent className="max-h-[85vh] bg-[#F9FAFC] rounded-t-[20px]">
          {/* Botón de cerrar */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowDetallesEnvio(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <DrawerHeader className="text-center py-4 border-b border-gray-200 pt-12">
            <DrawerTitle className="text-lg font-semibold">
              Detalles de envío
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-4 overflow-y-auto">
            {/* Card del Repartidor */}
            <Card className="bg-white">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Repartidor</p>
                    <p className="font-medium">{repartidor.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{repartidor.telefono}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full px-3"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {React.createElement(getMetodoPagoIcon(selectedPedido.metodo_pago), { className: "w-5 h-5 text-gray-500" })}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Método de pago</p>
                    <p className="font-medium">{metodoPagoText}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card del Bodegón */}
            <Card className="bg-white">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Bodegón</p>
                    <p className="font-medium">{bodegon.nombre}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{bodegon.telefono}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white rounded-full px-3"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Dirección</p>
                    <p className="font-medium text-sm leading-5">{bodegon.direccion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </DrawerContent>
      </Drawer>
    )
  }

  const renderPedidoDrawer = () => {
    if (!selectedPedido) return null

    return (
      <Drawer open={showPedidoModal} onOpenChange={setShowPedidoModal}>
        <DrawerContent className="max-h-[85vh] bg-[#F9FAFC] rounded-t-[20px]">
          {/* Botón de cerrar */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setShowPedidoModal(false)}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <DrawerHeader className="text-center py-4 border-b border-gray-200 pt-12">
            <DrawerTitle className="text-lg font-semibold">
              Detalles del pedido
            </DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-6 overflow-y-auto">
            {/* Factura Digital Header */}
            <div className="text-center space-y-2 pt-6">
              <h3 className="text-xl font-semibold">Factura Digital</h3>
              <p className="text-sm text-gray-500">
                {formatFecha(selectedPedido.fecha_pedido)} - {selectedPedido.hora_pedido}
              </p>
            </div>

            {/* Detalles principales */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">ID de Pedido</span>
                <span className="text-sm">#{selectedPedido.id}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Estatus</span>
                <Badge className={cn("text-xs border-0", getEstadoConfig(selectedPedido.estado).badgeColor)}>
                  {getEstadoConfig(selectedPedido.estado).label}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Monto</span>
                <span className="text-sm font-semibold">${selectedPedido.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Productos</h4>
              <div className="space-y-2">
                {selectedPedido.productos?.map((producto) => (
                  <div key={producto.id} className="flex justify-between items-center text-sm">
                    <span>{producto.cantidad}x {producto.nombre}</span>
                    <span>${producto.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-sm py-2">
                <span>Envío</span>
                <span>${selectedPedido.envio?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-base font-semibold py-3 border-t-2 border-dashed border-gray-400">
              <span>Total</span>
              <span>${selectedPedido.total.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 pb-20">
              <p>¡Gracias por su compra!</p>
              <p>Para soporte: support@example.com</p>
            </div>
          </div>

          {/* Footer fijo */}
          {selectedPedido.estado !== 'entregado' && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
              <Button 
                className="w-full h-12 text-base bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                onClick={() => setShowDetallesEnvio(true)}
              >
                Detalles de envío
              </Button>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Drawer de detalles del pedido */}
      {renderPedidoDrawer()}
      
      {/* Drawer de detalles de envío */}
      {renderDetallesEnvioDrawer()}

      {/* Topbar with Tabs */}
      <div className="bg-white border-b border-gray-100">
        {/* Header */}
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        </div>

        {/* Tabs */}
        <div>
          <div className="flex border-b border-gray-200 relative">
            {/* Sliding indicator background */}
            <div 
              className="absolute bottom-0 h-0.5 bg-orange-500 rounded-full transition-transform duration-300 ease-out"
              style={{
                width: '50%',
                transform: activeTab === 'pendientes' ? 'translateX(0%)' : 'translateX(100%)'
              }}
            />
            
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`flex-1 pb-3 relative transition-colors duration-200 ${
                activeTab === 'pendientes'
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setActiveTab('entregados')}
              className={`flex-1 pb-3 relative transition-colors duration-200 ${
                activeTab === 'entregados'
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Entregados
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {renderPedidosList()}
      </div>
    </div>
  )
}