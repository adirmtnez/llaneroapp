"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Download, Smartphone, Landmark, Globe, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  mapDatabaseStatusToUI,
  mapPaymentMethod,
  type CompleteOrder 
} from '@/utils/orders-service'

// Interfaces para compatibilidad con el detalle view
interface PedidoForDetail {
  id: string
  numero: string
  fecha: string
  hora: string
  cliente: {
    nombre: string
    email?: string
    direccion?: string
  }
  metodoPago: string
  estado: string
  tipoEntrega: 'domicilio' | 'pickup'
  direccionEntrega?: string
  subtotal: number
  envio: number
  total: number
  productos: Array<{
    id: string
    nombre: string
    cantidad: number
    precio: number
    total: number
  }>
  bodegon: string
  verification_code?: string
}

// Función para cargar todos los pedidos de bodegones
async function loadAllOrders() {
  try {
    console.log('🔍 Cargando todos los pedidos de bodegones...')
    
    const { nuclearSelect } = await import('@/utils/nuclear-client')
    
    // Primero cargar los pedidos básicos (solo pedidos de bodegones)
    const { data: ordersData, error } = await nuclearSelect(
      'orders',
      '*'
      // Sin filtro inicial - filtraremos después
    )

    if (error) {
      console.error('❌ Error cargando pedidos:', error)
      return { orders: [], error: error.message || 'Error cargando pedidos' }
    }

    if (!ordersData || ordersData.length === 0) {
      console.log('📭 No hay pedidos')
      return { orders: [], error: null }
    }

    // Filtrar solo pedidos de bodegones (que tienen bodegon_id)
    const bodegonOrders = ordersData.filter((order: any) => order.bodegon_id !== null && order.bodegon_id !== undefined)
    
    if (bodegonOrders.length === 0) {
      console.log('📭 No hay pedidos de bodegones')
      return { orders: [], error: null }
    }

    // Enriquecer cada pedido con datos relacionados
    const enrichedOrders = await Promise.all(
      bodegonOrders.map(async (order: any) => {
        try {
          // Cargar items del pedido
          const { data: orderItems } = await nuclearSelect(
            'order_item',
            '*',
            { order_id: order.id }
          )

          // Cargar productos para cada item por separado
          const enrichedOrderItems = await Promise.all(
            (orderItems || []).map(async (item: any) => {
              if (item.bodegon_product_id) {
                const { data: product } = await nuclearSelect(
                  'bodegon_products',
                  'id, name, price, image_gallery_urls',
                  { id: item.bodegon_product_id }
                )
                return { ...item, bodegon_products: product?.[0] || null }
              }
              return item
            })
          )

          // Cargar pagos
          const { data: payments } = await nuclearSelect(
            'order_payments',
            '*',
            { order_id: order.id }
          )

          // Cargar datos del usuario
          let profile = null
          try {
            const { data: userData, error: userError } = await nuclearSelect(
              'users',
              'id, name, email',
              { id: order.customer_id }
            )
            profile = userData || null
          } catch (err) {
            console.warn('⚠️ Error cargando usuario:', order.customer_id, err)
            // Fallback a datos por defecto
            profile = [{
              id: order.customer_id,
              name: `Cliente ${order.customer_id.slice(0, 8)}`,
              email: null
            }]
          }

          // Cargar dirección de entrega
          let customerAddress = null
          if (order.delivery_address_id) {
            console.log('🔍 Cargando dirección para ID:', order.delivery_address_id)
            const { data: address, error: addressError } = await nuclearSelect(
              'customer_addresses',
              'id, address_line1, address_line2, city, state, label',
              { id: order.delivery_address_id }
            )
            if (addressError) {
              console.error('❌ Error cargando dirección:', addressError)
            } else {
              console.log('✅ Dirección cargada:', address)
              customerAddress = address?.[0] || null
              console.log('📍 Customer address final:', customerAddress)
            }
          } else {
            console.log('⚠️ No hay delivery_address_id para el pedido:', order.id)
          }

          // Cargar bodegón
          let bodegon = null
          if (order.bodegon_id) {
            const { data: bodegonData } = await nuclearSelect(
              'bodegons',
              'id, name, phone_number, address',
              { id: order.bodegon_id }
            )
            bodegon = bodegonData?.[0] || null
          }

          return {
            ...order,
            order_item: enrichedOrderItems || [],
            order_payments: payments || [],
            users: profile?.[0] || null,
            customer_addresses: customerAddress,
            bodegons: bodegon
          }
        } catch (err) {
          console.warn('⚠️ Error enriqueciendo pedido:', order.id, err)
          return {
            ...order,
            order_item: [],
            order_payments: [],
            users: null,
            customer_addresses: null,
            bodegons: null
          }
        }
      })
    )

    // Ordenar por fecha más reciente primero
    const sortedOrders = enrichedOrders.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log('✅ Pedidos de bodegones cargados:', sortedOrders.length)
    return { orders: sortedOrders as CompleteOrder[], error: null }
    
  } catch (error) {
    console.error('💥 Error inesperado cargando pedidos:', error)
    return { orders: [], error: 'Error inesperado cargando pedidos' }
  }
}

function getMetodoPagoIcon(metodo: string) {
  switch (metodo) {
    case 'pagomovil':
      return Smartphone
    case 'transferencia':
      return Landmark
    case 'zelle':
    case 'banesco':
      return Globe
    default:
      return Smartphone
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

interface BodegonesPedViewProps {
  onViewPedido?: (pedido: PedidoForDetail) => void
}

export function BodegonesPedView({ onViewPedido }: BodegonesPedViewProps = {}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [allOrders, setAllOrders] = useState<CompleteOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<CompleteOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Función para cargar pedidos
  const loadOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const { orders, error: loadError } = await loadAllOrders()
      
      if (loadError) {
        setError(loadError)
        console.error('❌ Error cargando pedidos:', loadError)
      } else {
        setAllOrders(orders)
        console.log('✅ Pedidos cargados:', orders.length)
      }
    } catch (err) {
      console.error('💥 Error inesperado:', err)
      setError('Error inesperado al cargar pedidos')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Cargar pedidos al montar componente
  useEffect(() => {
    loadOrders()
  }, [])

  // Agrupar pedidos por fecha
  const pedidosAgrupados = filteredOrders.reduce((acc, pedido) => {
    if (!pedido?.created_at) return acc
    const fecha = pedido.created_at.split('T')[0]
    if (!acc[fecha]) {
      acc[fecha] = []
    }
    acc[fecha].push(pedido)
    return acc
  }, {} as Record<string, CompleteOrder[]>)

  // Ordenar fechas (más recientes primero)
  const fechasOrdenadas = Object.keys(pedidosAgrupados).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  )

  // Filtrar pedidos
  useEffect(() => {
    let filtered = allOrders
    
    if (searchTerm) {
      filtered = allOrders.filter(pedido => 
        pedido.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.bodegons?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.users?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredOrders(filtered)
  }, [searchTerm, allOrders])

  // Función para manejar el click en una card y convertir datos
  const handlePedidoClick = (pedido: CompleteOrder) => {
    if (!onViewPedido) return
    
    // Debug: Ver qué datos de dirección tenemos
    console.log('🏠 Datos de dirección:', {
      customer_addresses: pedido.customer_addresses,
      address_line1: pedido.customer_addresses?.address_line1,
      address_line2: pedido.customer_addresses?.address_line2,
      city: pedido.customer_addresses?.city,
      state: pedido.customer_addresses?.state
    })

    // Debug: Ver el array de componentes de dirección
    const addressComponents = [
      pedido.customer_addresses?.address_line1,
      pedido.customer_addresses?.address_line2,
      pedido.customer_addresses?.city,
      pedido.customer_addresses?.state
    ]
    console.log('📍 Componentes de dirección:', addressComponents)
    console.log('📍 Componentes filtrados:', addressComponents.filter(Boolean))
    console.log('📍 Dirección final:', addressComponents.filter(Boolean).join(', '))

    // Convertir datos del pedido al formato que espera DetallePedidoView
    const detallePedido: PedidoForDetail = {
      id: pedido.id,
      numero: pedido.order_number,
      fecha: pedido.created_at.split('T')[0],
      hora: format(parseISO(pedido.created_at), 'HH:mm'),
      cliente: {
        nombre: pedido.users?.name || 'Cliente',
        email: pedido.users?.email || undefined,
        telefono: pedido.customer_phone || undefined,
        direccion: pedido.customer_addresses ? 
          [
            pedido.customer_addresses.address_line1,
            pedido.customer_addresses.address_line2,
            pedido.customer_addresses.city,
            pedido.customer_addresses.state
          ].filter(Boolean).join(', ') : undefined
      },
      metodoPago: pedido.order_payments?.[0]?.payment_method || 'pagomovil',
      estado: pedido.status,
      tipoEntrega: pedido.delivery_mode === 'delivery' ? 'domicilio' : 'pickup',
      direccionEntrega: undefined, // Ya se muestra en cliente.direccion
      subtotal: pedido.subtotal,
      envio: pedido.shipping_cost,
      total: pedido.total_amount,
      productos: (pedido.order_item || []).map(item => ({
        id: item.id,
        nombre: item.bodegon_products?.name || item.name_snapshot || 'Producto',
        cantidad: item.quantity,
        precio: item.unit_price,
        total: item.quantity * item.unit_price
      })),
      bodegon: pedido.bodegons?.name || 'Bodegón',
      verification_code: pedido.verification_code
    }
    
    onViewPedido(detallePedido)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-muted-foreground">
              Gestiona todos los pedidos de tus bodegones
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por número de pedido o bodegón..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 md:h-9 text-base md:text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:ml-auto">
            {/* Botón de refresh manual */}
            <Button
              variant="outline"
              size="sm"
              className="h-10 md:h-8 text-base md:text-sm"
              onClick={loadOrders}
              disabled={isLoading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Recargar
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 md:h-8 text-base md:text-sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 md:h-8 text-base md:text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

      </div>

      {/* Lista de Pedidos */}
      <div className="space-y-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
              <p className="text-gray-600 text-sm">Cargando pedidos...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex-1 flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Package className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error cargando pedidos</h3>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && fechasOrdenadas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron pedidos
          </div>
        )}
        
        {/* Orders list */}
        {!isLoading && !error && fechasOrdenadas.length > 0 && (
          fechasOrdenadas.map(fecha => (
            <div key={fecha} className="space-y-4">
              {/* Separador de fecha */}
              <h3 className="text-sm font-medium text-muted-foreground px-1">
                {formatFecha(fecha)}
              </h3>
              
              {/* Pedidos de esta fecha */}
              <div className="space-y-2">
                {pedidosAgrupados[fecha].map(pedido => {
                  if (!pedido?.id) return null
                  
                  const estadoConfig = mapDatabaseStatusToUI(pedido.status || 'pending')
                  const paymentMethod = pedido.order_payments?.[0]?.payment_method || 'pagomovil'
                  const MetodoPagoIcon = getMetodoPagoIcon(paymentMethod)
                  const horaCreacion = pedido.created_at ? (() => {
                    try {
                      return format(parseISO(pedido.created_at), 'HH:mm')
                    } catch (err) {
                      console.error('Error formateando hora:', pedido.created_at, err)
                      return '--:--'
                    }
                  })() : '--:--'
                  
                  return (
                    <Card 
                      key={pedido.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer py-0"
                      onClick={() => handlePedidoClick(pedido)}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center space-x-3">
                            {/* Icono de método de pago en contenedor rectangular */}
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                              <MetodoPagoIcon className="h-4 w-4 text-gray-600" />
                            </div>
                            
                            {/* Info del pedido */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {pedido.order_number || 'Sin número'}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge className={cn("text-xs border-0", estadoConfig.variant)}>
                                  {estadoConfig.label}
                                </Badge>
                                <span className="text-muted-foreground">•</span>
                                <p className="text-xs text-muted-foreground">
                                  {horaCreacion}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Monto y chevron */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">
                              ${(pedido.total_amount || 0).toFixed(2)}
                            </p>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }).filter(Boolean)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}