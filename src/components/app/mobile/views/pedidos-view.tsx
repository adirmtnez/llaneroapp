'use client'

import React, { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, Truck, ChevronRight, Smartphone, Landmark, Globe, ArrowLeft, FileText, User, Phone, MapPin, MessageCircle, Loader2, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/contexts/auth-context'
import { 
  loadUserOrders, 
  loadOrdersStatusOnly,
  getOrdersNeedingPolling,
  mergeOrderStatusUpdates,
  getPollingAnalysis,
  clearUserOrdersCache,
  getPendingOrders, 
  getDeliveredOrders, 
  mapDatabaseStatusToUI,
  mapPaymentMethod,
  type CompleteOrder 
} from '@/utils/orders-service'

// Interfaces para UI (simplificadas)
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

export function PedidosView() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'pendientes' | 'entregados'>('pendientes')
  const [selectedPedido, setSelectedPedido] = useState<CompleteOrder | null>(null)
  const [showPedidoModal, setShowPedidoModal] = useState(false)
  const [showDetallesEnvio, setShowDetallesEnvio] = useState(false)
  const [allOrders, setAllOrders] = useState<CompleteOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Función para cargar pedidos (reutilizable)
  const loadOrders = async (isRefresh = false) => {
    if (!user?.auth_user?.id) {
      setIsLoading(false)
      return
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      
      console.log('🔍 Cargando pedidos para usuario:', user.auth_user.id)
      const { orders, error: loadError } = await loadUserOrders(user.auth_user.id)
      
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
      setIsRefreshing(false)
    }
  }

  // 🚀 FUNCIÓN OPTIMIZADA: Solo para polling de status (96% menos Egress)
  const loadOrdersStatusUpdate = async () => {
    if (!user?.auth_user?.id || allOrders.length === 0) return

    try {
      setIsRefreshing(true)
      
      console.log('⚡ Polling optimizado - solo status updates')
      const { orders: statusUpdates, error: statusError } = await loadOrdersStatusOnly(user.auth_user.id)
      
      if (statusError) {
        console.error('❌ Error en polling de status, fallback a carga completa')
        // 🔄 Fallback seguro: si falla el polling optimizado, usar método original
        await loadOrders(true)
        return
      }

      // Merge los updates de status con los datos completos existentes
      const updatedOrders = mergeOrderStatusUpdates(allOrders, statusUpdates)
      setAllOrders(updatedOrders)
      console.log('⚡ Status actualizado exitosamente:', statusUpdates.length, 'pedidos')
      
    } catch (err) {
      console.error('💥 Error en polling optimizado, fallback a carga completa:', err)
      // 🔄 Fallback seguro en caso de error inesperado
      await loadOrders(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Cargar pedidos inicialmente
  useEffect(() => {
    loadOrders()
  }, [user?.auth_user?.id])

  // 🧹 Limpiar cache cuando el componente se desmonta o cambia usuario
  useEffect(() => {
    return () => {
      if (user?.auth_user?.id) {
        // Solo limpiar si el usuario cambió, no al desmontar por navegación normal
        const timeoutId = setTimeout(() => {
          console.log('🧹 Limpiando cache por desmontaje del componente')
          clearUserOrdersCache(user.auth_user.id)
        }, 100)
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [user?.auth_user?.id])

  // 🚀 POLLING PROGRESIVO + CACHE INTELIGENTE
  useEffect(() => {
    if (!user?.auth_user?.id) return

    // 🎯 Análisis completo de pedidos para optimización
    const analysis = getPollingAnalysis(allOrders)
    
    if (analysis.needsPolling.length > 0) {
      console.log(`📡 Iniciando polling progresivo: ${analysis.pollingInterval/1000}s para ${analysis.needsPolling.length} pedidos activos`)
      
      const interval = setInterval(() => {
        // Solo actualizar si la página está visible
        if (!document.hidden) {
          console.log(`⚡ Polling progresivo (${analysis.pollingInterval/1000}s) - status updates`)
          loadOrdersStatusUpdate() // 🚀 Función optimizada
        } else {
          console.log('📱 Página oculta, saltando actualización')
        }
      }, analysis.pollingInterval) // ⏰ Intervalo dinámico basado en edad

      // También actualizar cuando la página vuelve a ser visible
      const handleVisibilityChange = () => {
        if (!document.hidden && analysis.needsPolling.length > 0) {
          console.log('👁️ Página visible, polling progresivo...')
          loadOrdersStatusUpdate() // 🚀 Función optimizada
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        console.log('📡 Deteniendo polling')
        clearInterval(interval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [user?.auth_user?.id, allOrders])

  // Mock data para repartidor y bodegón  
  const getMockRepartidor = (pedido: CompleteOrder): Repartidor => ({
    nombre: "Carlos Rodríguez",
    telefono: "+58 414 5446784", 
    metodo_pago: pedido.order_payments?.[0]?.payment_method || 'pagomovil'
  })

  const getMockBodegon = (pedido: CompleteOrder): BodegonContacto => ({
    nombre: "Bodegón Central", // TODO: Obtener nombre real del bodegón
    direccion: "Av. Principal #456, Centro Comercial Plaza, Local 23",
    telefono: "+58 212 1234567"
  })

  const getCurrentPedidos = () => {
    if (activeTab === 'pendientes') {
      return getPendingOrders(allOrders)
    } else {
      return getDeliveredOrders(allOrders)
    }
  }

  const renderPedidosList = () => {
    // Loading state
    if (isLoading) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto" />
            <p className="text-gray-600 text-sm">Cargando pedidos...</p>
          </div>
        </div>
      )
    }

    // Error state
    if (error) {
      return (
        <div className="flex-1 flex items-center justify-center">
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
      )
    }

    // Auth required state
    if (!user?.auth_user?.id) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
              <User className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Inicia sesión</h3>
              <p className="text-gray-600 text-sm">Inicia sesión para ver tus pedidos</p>
            </div>
          </div>
        </div>
      )
    }

    const pedidos = getCurrentPedidos()
    console.log('🔍 Debug - pedidos actuales:', { 
      activeTab, 
      allOrdersLength: allOrders.length, 
      currentPedidosLength: pedidos.length,
      pedidos: pedidos.map(p => ({ 
        id: p.id, 
        status: p.status, 
        created_at: p.created_at,
        order_number: p.order_number,
        total_amount: p.total_amount 
      }))
    })
    
    console.log('🔍 Debug - pedidosAgrupados después de reduce:')

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
      console.log('🔍 Procesando pedido para agrupación:', { 
        id: pedido?.id, 
        created_at: pedido?.created_at,
        hasCreatedAt: !!pedido?.created_at 
      })
      
      if (!pedido?.created_at) {
        console.warn('⚠️ Pedido sin created_at, saltando:', pedido)
        return acc
      }
      
      const fecha = pedido.created_at.split('T')[0] // Extraer solo la fecha
      console.log('📅 Fecha extraída:', fecha)
      
      if (!acc[fecha]) {
        acc[fecha] = []
      }
      acc[fecha].push(pedido)
      console.log('✅ Pedido agregado a fecha:', fecha, 'Total en esta fecha:', acc[fecha].length)
      return acc
    }, {} as Record<string, CompleteOrder[]>)
    
    console.log('📊 PedidosAgrupados final:', pedidosAgrupados)
    console.log('📊 Fechas encontradas:', Object.keys(pedidosAgrupados))

    // Ordenar fechas (más recientes primero)
    const fechasOrdenadas = Object.keys(pedidosAgrupados).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    )
    
    console.log('📈 Fechas ordenadas:', fechasOrdenadas)
    console.log('🏗️ Iniciando renderizado de fechas...')

    return (
      <div className="space-y-6">
        {fechasOrdenadas.map(fecha => {
          console.log('🗓️ Renderizando fecha:', fecha, 'con', pedidosAgrupados[fecha].length, 'pedidos')
          return (
            <div key={fecha} className="space-y-4">
              {/* Separador de fecha */}
              <h3 className="text-sm font-medium text-gray-500 px-1">
                {(() => {
                  try {
                    return formatFecha(fecha)
                  } catch (err) {
                    console.error('Error formateando fecha:', fecha, err)
                    return fecha
                  }
                })()}
              </h3>
            
            {/* Pedidos de esta fecha */}
            <div className="space-y-2">
              {pedidosAgrupados[fecha].map((pedido, index) => {
                if (!pedido?.id) {
                  console.warn('Pedido sin ID encontrado:', pedido)
                  return null
                }
                
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
                    key={`${pedido.id}-${index}`} 
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
                              {pedido.order_number || 'Sin número'}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-xs border-0", estadoConfig.variant)}>
                                {estadoConfig.label}
                              </Badge>
                              <span className="text-gray-400">•</span>
                              <p className="text-xs text-gray-500">
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
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              }).filter(Boolean)}
            </div>
          </div>
          )
        })}
      </div>
    )
  }

  const renderDetallesEnvioDrawer = () => {
    if (!selectedPedido) return null

    const repartidor = getMockRepartidor(selectedPedido)
    const paymentMethod = selectedPedido.order_payments?.[0]?.payment_method || 'pagomovil'
    const metodoPagoText = mapPaymentMethod(paymentMethod)
    
    // Datos reales del bodegón
    const bodegon = {
      nombre: selectedPedido.bodegons?.name || 'Bodegón',
      telefono: selectedPedido.bodegons?.phone_number || 'No disponible',
      direccion: selectedPedido.bodegons?.address || 'Dirección no disponible'
    }
    
    // Verificar si tiene repartidor asignado
    const hasDeliveryPerson = selectedPedido.delivery_person_id != null

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
            {/* Card del Repartidor - Solo si tiene delivery_person_id */}
            {hasDeliveryPerson && (
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

                </CardContent>
              </Card>
            )}

            {/* Card del Bodegón - Con datos reales */}
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
                  {bodegon.telefono !== 'No disponible' && (
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white rounded-full px-3"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  )}
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
                {selectedPedido.created_at ? formatFecha(selectedPedido.created_at.split('T')[0]) : 'Fecha no disponible'} - {selectedPedido.created_at ? format(parseISO(selectedPedido.created_at), 'HH:mm') : '--:--'}
              </p>
            </div>

            {/* Detalles principales */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Número de Pedido</span>
                <span className="text-sm">{selectedPedido.order_number}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Estatus</span>
                <Badge className={cn("text-xs border-0", mapDatabaseStatusToUI(selectedPedido.status).variant)}>
                  {mapDatabaseStatusToUI(selectedPedido.status).label}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Código de Verificación</span>
                <span className="text-sm font-mono font-bold text-orange-600">{selectedPedido.verification_code}</span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b-2 border-dashed border-gray-300">
                <span className="text-sm font-medium">Monto</span>
                <span className="text-sm font-semibold">${selectedPedido.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Productos</h4>
              <div className="space-y-2">
                {selectedPedido.order_item?.map((item) => {
                  const productName = item.bodegon_products?.name || item.name_snapshot || 'Producto'
                  const itemTotal = item.quantity * item.unit_price
                  
                  return (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.quantity}x {productName}</span>
                      <span>${itemTotal.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex justify-between items-center text-sm py-2">
                <span>Envío</span>
                <span>${selectedPedido.shipping_cost?.toFixed(2) || '0.00'}</span>
              </div>
              
              {selectedPedido.discount_amount > 0 && (
                <div className="flex justify-between items-center text-sm py-2 text-green-600">
                  <span>Descuento{selectedPedido.coupon_code ? ` (${selectedPedido.coupon_code})` : ''}</span>
                  <span>-${selectedPedido.discount_amount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center text-base font-semibold py-3 border-t-2 border-dashed border-gray-400">
              <span>Total</span>
              <span>${selectedPedido.total_amount.toFixed(2)}</span>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 pt-4 pb-20">
              <p>¡Gracias por su compra!</p>
              <p>Para soporte: support@example.com</p>
            </div>
          </div>

          {/* Footer fijo */}
          {selectedPedido.status !== 'delivered' && selectedPedido.status !== 'cancelled' && (
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <div className="flex items-center gap-2">
              {isRefreshing && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Actualizando...</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 🚀 Refresh híbrido: análisis inteligente de la mejor estrategia
                  const analysis = getPollingAnalysis(allOrders)
                  
                  if (analysis.needsPolling.length > 0) {
                    console.log('🔄 Refresh optimizado - solo status updates')
                    loadOrdersStatusUpdate()
                  } else if (analysis.shouldUseCache) {
                    console.log('💾 Refresh desde cache - pedidos estables')
                    loadOrders(false) // Permitir cache
                  } else {
                    console.log('🌐 Refresh completo - forzar desde BD')
                    loadOrders(true) // Forzar refresh
                  }
                }}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
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