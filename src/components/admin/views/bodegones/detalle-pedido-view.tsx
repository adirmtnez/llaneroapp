"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, CreditCard, Smartphone, Landmark, Globe, CheckCircle, Clock, Package, Truck, Home, MapPin, Printer, Edit, User, X, ChevronDown, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { 
  mapDatabaseStatusToUI,
  mapPaymentMethod
} from '@/utils/orders-service'
import { nuclearUpdate, nuclearDelete } from '@/utils/nuclear-client'

// Interfaces
interface ProductoPedido {
  id: string
  nombre: string
  imagen?: string
  cantidad: number
  precio: number
  total: number
}

interface Repartidor {
  id: string
  nombre: string
  telefono?: string
  activo: boolean
}

interface DetallePedido {
  id: string
  numero: string
  fecha: string
  hora: string
  cliente: {
    nombre: string
    email?: string
    telefono?: string
    direccion?: string
  }
  metodoPago: string
  estado: string
  repartidor_id?: string
  tipoEntrega: 'domicilio' | 'pickup'
  direccionEntrega?: string
  subtotal: number
  envio: number
  total: number
  productos: ProductoPedido[]
  bodegon: string
  verification_code?: string
}

interface DetallePedidoViewProps {
  onBack: () => void
  pedido?: DetallePedido
  onEdit?: () => void
  onPrint?: () => void
  onPedidoUpdate?: (updatedPedido: DetallePedido) => void
  onPedidoDelete?: (deletedPedidoId: string) => void
}

// Mock data de repartidores
const mockRepartidores: Repartidor[] = [
  { id: '1', nombre: 'Carlos Mendoza', telefono: '+58 424-123-4567', activo: true },
  { id: '2', nombre: 'Ana García', telefono: '+58 416-987-6543', activo: true },
  { id: '3', nombre: 'Luis Rodríguez', telefono: '+58 426-555-0123', activo: true },
  { id: '4', nombre: 'María López', telefono: '+58 414-222-8888', activo: false },
  { id: '5', nombre: 'José Torres', telefono: '+58 424-111-9999', activo: true }
]


function getMetodoPagoInfo(metodo: string) {
  const metodoPagoText = mapPaymentMethod(metodo)
  
  switch (metodo) {
    case 'pagomovil':
      return {
        icon: Smartphone,
        label: metodoPagoText,
        detail: 'Pago móvil'
      }
    case 'transferencia':
      return {
        icon: Landmark,
        label: metodoPagoText,
        detail: 'Transferencia bancaria'
      }
    case 'zelle':
      return {
        icon: Globe,
        label: metodoPagoText,
        detail: 'Zelle'
      }
    case 'banesco':
      return {
        icon: Globe,
        label: metodoPagoText,
        detail: 'Banesco Panamá'
      }
    default:
      return {
        icon: Smartphone,
        label: metodoPagoText,
        detail: 'Método de pago'
      }
  }
}

function getEstadoInfo(estado: string) {
  const estados = [
    { key: 'pending', label: 'Procesando', icon: Clock },
    { key: 'confirmed', label: 'Confirmado', icon: CheckCircle },
    { key: 'preparing', label: 'Preparando', icon: Package },
    { key: 'shipped', label: 'Enviado', icon: Truck },
    { key: 'delivered', label: 'Entregado', icon: CheckCircle }
  ]
  
  const currentIndex = estados.findIndex(e => e.key === estado)
  
  return estados.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    active: index === currentIndex
  }))
}

export function DetallePedidoView({ 
  onBack, 
  pedido,
  onEdit,
  onPrint,
  onPedidoUpdate,
  onPedidoDelete
}: DetallePedidoViewProps) {
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEstado, setEditEstado] = useState<string>('')
  const [editRepartidor, setEditRepartidor] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Estado local del pedido para actualizaciones en tiempo real
  const [localPedido, setLocalPedido] = useState<DetallePedido | null>(null)
  
  // Estados para el indicador de scroll
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Inicializar estado local con el pedido proporcionado
  useEffect(() => {
    if (pedido) {
      setLocalPedido(pedido)
    }
  }, [pedido])

  // Limpiar texto de confirmación cuando se cierra el modal
  useEffect(() => {
    if (!showDeleteModal) {
      setDeleteConfirmText('')
    }
  }, [showDeleteModal])
  
  // Usar el pedido local si existe, sino el proporcionado
  const pedidoData = localPedido || pedido
  
  // Debug: Ver qué datos de cliente están llegando
  console.log('👤 Datos del cliente:', pedidoData?.cliente)
  
  // Si no hay pedido proporcionado, mostrar mensaje
  if (!pedidoData) {
    return (
      <div className="space-y-6 w-full max-w-4xl mx-auto pt-4 pb-24">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="h-10 md:h-8">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Detalle del Pedido
          </h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">No se encontró información del pedido</p>
        </div>
      </div>
    )
  }
  
  const metodoPago = getMetodoPagoInfo(pedidoData.metodoPago)
  const pasos = getEstadoInfo(pedidoData.estado)
  const MetodoPagoIcon = metodoPago.icon

  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      // Funcionalidad de impresión por defecto
      window.print()
    }
  }

  const handleEdit = () => {
    // Siempre abrir el modal de edición local
    setEditEstado(pedidoData.estado)
    setEditRepartidor(pedidoData.repartidor_id || 'sin_asignar')
    setShowEditModal(true)
  }

  // Hook para detectar si estamos en mobile y si hay scroll
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current
        setShowScrollIndicator(scrollHeight > clientHeight && isMobile)
      }
    }
    
    checkMobile()
    checkScrollable()
    
    window.addEventListener('resize', () => {
      checkMobile()
      checkScrollable()
    })
    
    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('resize', checkScrollable)
    }
  }, [isMobile, pedidoData.productos.length])

  const handleSaveEdit = async () => {
    if (!editEstado) {
      toast.error('Debe seleccionar un estado')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Actualizar el estado del pedido en la base de datos
      const updateData: any = {
        status: editEstado,
        updated_at: new Date().toISOString()
      }
      
      // Solo agregar delivery_person_id si no es 'sin_asignar'
      if (editRepartidor !== 'sin_asignar') {
        updateData.delivery_person_id = editRepartidor
      } else {
        updateData.delivery_person_id = null
      }
      
      console.log('🔄 Actualizando pedido:', {
        id: pedidoData.id,
        updateData
      })
      
      const { error } = await nuclearUpdate(
        'orders',
        pedidoData.id,
        updateData
      )
      
      if (error) {
        console.error('❌ Error actualizando pedido:', error)
        toast.error('Error al actualizar el pedido')
        return
      }
      
      toast.success('Pedido actualizado exitosamente')
      setShowEditModal(false)
      
      // Actualizar el estado local del pedido inmediatamente
      if (pedidoData) {
        const updatedPedido = {
          ...pedidoData,
          estado: editEstado
        }
        
        // Actualizar estado local para reflejar cambios inmediatamente
        setLocalPedido(updatedPedido)
        
        // Actualizar el localStorage con los nuevos datos
        try {
          const savedPedido = localStorage.getItem('adminSelectedPedido')
          if (savedPedido) {
            const parsedPedido = JSON.parse(savedPedido)
            const updated = { ...parsedPedido, estado: editEstado }
            localStorage.setItem('adminSelectedPedido', JSON.stringify(updated))
          }
        } catch (err) {
          console.warn('Error actualizando pedido en localStorage:', err)
        }
        
        // Notificar al componente padre del cambio
        if (onPedidoUpdate) {
          onPedidoUpdate(updatedPedido)
        }
      }
      
      // Opcional: callback para notificar al componente padre
      if (onEdit) {
        onEdit()
      }
      
    } catch (error) {
      console.error('💥 Error inesperado:', error)
      toast.error('Error inesperado al actualizar el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Función para eliminar el pedido
  const handleDeletePedido = async () => {
    if (deleteConfirmText !== pedidoData.numero) {
      toast.error('El número de pedido no coincide')
      return
    }

    setIsDeleting(true)
    
    try {
      console.log('🗑️ Eliminando pedido:', pedidoData.id)
      
      const { nuclearSelect } = await import('@/utils/nuclear-client')
      
      // 1. Eliminar order_tracking relacionados (si existe)
      console.log('🗑️ Eliminando order_tracking...')
      try {
        const { data: orderTracking } = await nuclearSelect('order_tracking', 'id', { order_id: pedidoData.id })
        if (orderTracking && orderTracking.length > 0) {
          for (const tracking of orderTracking) {
            const { error: trackingError } = await nuclearDelete('order_tracking', tracking.id)
            if (trackingError) {
              console.error('❌ Error eliminando order_tracking:', tracking.id, trackingError)
            }
          }
        }
      } catch (err) {
        console.log('ℹ️ Tabla order_tracking no existe o no hay registros')
      }
      
      // 2. Eliminar order_items relacionados
      console.log('🗑️ Eliminando order_items...')
      const { data: orderItems } = await nuclearSelect('order_item', 'id', { order_id: pedidoData.id })
      
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          const { error: itemError } = await nuclearDelete('order_item', item.id)
          if (itemError) {
            console.error('❌ Error eliminando order_item:', item.id, itemError)
            toast.error(`Error eliminando producto del pedido`)
            return
          }
        }
        console.log(`✅ Eliminados ${orderItems.length} order_items`)
      }
      
      // 3. Eliminar order_payments relacionados
      console.log('🗑️ Eliminando order_payments...')
      const { data: orderPayments } = await nuclearSelect('order_payments', 'id', { order_id: pedidoData.id })
      
      if (orderPayments && orderPayments.length > 0) {
        for (const payment of orderPayments) {
          const { error: paymentError } = await nuclearDelete('order_payments', payment.id)
          if (paymentError) {
            console.error('❌ Error eliminando order_payment:', payment.id, paymentError)
            toast.error(`Error eliminando información de pago`)
            return
          }
        }
        console.log(`✅ Eliminados ${orderPayments.length} order_payments`)
      }
      
      // 4. Finalmente, eliminar el pedido principal
      console.log('🗑️ Eliminando pedido principal...')
      const { error: orderError } = await nuclearDelete('orders', pedidoData.id)
      
      if (orderError) {
        console.error('❌ Error eliminando pedido:', orderError)
        toast.error(`Error al eliminar el pedido: ${orderError}`)
        return
      }
      
      console.log('✅ Pedido eliminado exitosamente')
      toast.success(`Pedido ${pedidoData.numero} eliminado exitosamente`)
      setShowDeleteModal(false)
      
      // Notificar al componente padre
      if (onPedidoDelete) {
        onPedidoDelete(pedidoData.id)
      }
      
      // Regresar a la lista de pedidos
      onBack()
      
    } catch (error) {
      console.error('💥 Error inesperado eliminando pedido:', error)
      toast.error('Error inesperado al eliminar el pedido')
    } finally {
      setIsDeleting(false)
    }
  }

  // Componente del formulario de edición
  const EditForm = () => (
    <div className="space-y-6">
      {/* Estado del pedido */}
      <div className="space-y-2">
        <Label htmlFor="estado">Estado del Pedido *</Label>
        <Select value={editEstado} onValueChange={setEditEstado}>
          <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Procesando
              </div>
            </SelectItem>
            <SelectItem value="confirmed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Confirmado
              </div>
            </SelectItem>
            <SelectItem value="preparing">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Preparando
              </div>
            </SelectItem>
            <SelectItem value="shipped">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                Enviado
              </div>
            </SelectItem>
            <SelectItem value="delivered">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Entregado
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Repartidor */}
      <div className="space-y-2">
        <Label htmlFor="repartidor">Repartidor Asignado</Label>
        <Select value={editRepartidor} onValueChange={setEditRepartidor}>
          <SelectTrigger className="h-12 md:h-10 py-3 text-base md:text-sm">
            <SelectValue placeholder="Seleccionar repartidor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sin_asignar">Sin asignar</SelectItem>
            {mockRepartidores.filter(r => r.activo).map((repartidor) => (
              <SelectItem key={repartidor.id} value={repartidor.id}>
                <div className="flex items-center gap-2 w-full text-left">
                  <User className="w-4 h-4 text-gray-600" />
                  <div className="text-left">
                    <p className="font-medium text-left">{repartidor.nombre}</p>
                    {repartidor.telefono && (
                      <p className="text-xs text-muted-foreground text-left">{repartidor.telefono}</p>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pt-4 pb-24">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-10 md:h-8">
          <ArrowLeftIcon className="w-4 h-4" />
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Pedido {pedidoData.numero}
        </h1>
      </div>

      {/* Layout en 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda (2/3 del ancho) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Información del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pedido {pedidoData.numero}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Realizado el {new Date(pedidoData.fecha).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: '2-digit', 
                  day: '2-digit'
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4 className="font-medium text-sm mb-2">Información del Cliente</h4>
                <div className="text-sm space-y-2">
                  <p className="font-medium">{pedidoData.cliente.nombre}</p>
                  {pedidoData.cliente.email && (
                    <p className="text-muted-foreground">{pedidoData.cliente.email}</p>
                  )}
                  {pedidoData.cliente.telefono && (
                    <p className="text-muted-foreground">{pedidoData.cliente.telefono}</p>
                  )}
                  {pedidoData.cliente.direccion && (
                    <p className="text-muted-foreground leading-relaxed">{pedidoData.cliente.direccion}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-sm mb-2">Método de Pago</h4>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-md border">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
                    <MetodoPagoIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{metodoPago.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{metodoPago.detail}</p>
                  </div>
                </div>
              </div>
                
              {/* Código de verificación */}
              {pedidoData.verification_code && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm mb-2">Código de Verificación</h4>
                  <div className="p-4 bg-orange-50 rounded-md border border-orange-200">
                    <p className="font-mono font-bold text-lg text-orange-600 text-center">
                      {pedidoData.verification_code}
                    </p>
                    <p className="text-xs text-center text-orange-600 mt-1">
                      Código para confirmar entrega
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estado del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Indicador de progreso visual */}
                <div className="flex items-center justify-between relative">
                  {pasos.map((paso, index) => (
                    <div key={paso.key} className="flex flex-col items-center relative z-10">
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2",
                        paso.completed 
                          ? "bg-green-100 border-green-500 text-green-700"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                      )}>
                        <paso.icon className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "text-xs text-center font-medium",
                        paso.completed ? "text-gray-900" : "text-gray-400"
                      )}>
                        {paso.label}
                      </span>
                    </div>
                  ))}
                  
                  {/* Línea de progreso */}
                  <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-0">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ 
                        width: `${((pasos.findIndex(p => p.active) + 1) / pasos.length) * 100}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* Badge del estado actual */}
                <div className="flex justify-center">
                  <Badge className={cn("border-0", mapDatabaseStatusToUI(pedidoData.estado).variant)}>
                    {mapDatabaseStatusToUI(pedidoData.estado).label}
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    {new Date(pedidoData.fecha).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Productos del Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header de la tabla - fijo */}
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-2 sticky top-0 bg-white z-10">
                  <div className="col-span-5">Producto</div>
                  <div className="col-span-2">Cantidad</div>
                  <div className="col-span-2">Precio</div>
                  <div className="col-span-3">Total</div>
                </div>
                
                {/* Contenedor scrolleable para productos */}
                <div className="relative">
                  <div 
                    ref={scrollContainerRef}
                    className="max-h-80 overflow-y-auto"
                  >
                    {/* Productos */}
                    {pedidoData.productos.map((producto) => (
                      <div key={producto.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 last:border-0">
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{producto.nombre}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-sm">
                          {producto.cantidad}
                        </div>
                        <div className="col-span-2 text-sm">
                          ${producto.precio.toFixed(2)}
                        </div>
                        <div className="col-span-3 font-medium text-sm">
                          ${producto.total.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Indicador de scroll para móviles */}
                  {showScrollIndicator && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm border">
                        <ChevronDown className="w-4 h-4 text-gray-500 animate-bounce" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha (1/3 del ancho) */}
        <div className="space-y-6">
          
          {/* Resumen del pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${pedidoData.subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span className="font-medium">${pedidoData.envio.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg">${pedidoData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de entrega */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalle de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
                  {pedidoData.tipoEntrega === 'domicilio' ? (
                    <Home className="w-4 h-4 text-gray-600" />
                  ) : (
                    <MapPin className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {pedidoData.tipoEntrega === 'domicilio' ? 'Entrega a Domicilio' : 'Retiro en Tienda'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pedidoData.tipoEntrega === 'domicilio' 
                      ? (pedidoData.direccionEntrega || 'Dirección no especificada')
                      : `Retiro en: ${pedidoData.bodegon}`
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white border-t border-gray-200 p-4 z-10">
        <div className="flex justify-between gap-3">
          {/* Botón de eliminar a la izquierda */}
          <Button 
            type="button" 
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="h-11 md:h-10 text-base md:text-sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
          
          {/* Botones principales a la derecha */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrint}
              className="h-11 md:h-10 text-base md:text-sm"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button 
              type="button" 
              onClick={handleEdit}
              className="h-11 md:h-10 text-base md:text-sm"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Modal/Drawer de Edición */}
      {isMobile ? (
        <Drawer open={showEditModal} onOpenChange={setShowEditModal}>
          <DrawerContent className="px-4">
            <DrawerHeader>
              <DrawerTitle>Editar Pedido {pedidoData.numero}</DrawerTitle>
              <DrawerDescription>
                Actualiza el estado del pedido y asigna un repartidor
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 pb-6">
              <EditForm />
            </div>
            
            <DrawerFooter className="px-4 pb-4">
              <div className="flex gap-3">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1 h-11 text-base">
                    Cancelar
                  </Button>
                </DrawerClose>
                <Button 
                  onClick={handleSaveEdit} 
                  disabled={isSubmitting}
                  className="flex-1 h-11 text-base"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Pedido {pedidoData.numero}</DialogTitle>
              <DialogDescription>
                Actualiza el estado del pedido y asigna un repartidor
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <EditForm />
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
                className="h-10 text-sm"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={isSubmitting}
                className="h-10 text-sm"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal/Drawer de Confirmación de Eliminación */}
      {isMobile ? (
        <Drawer open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DrawerContent className="px-4">
            <DrawerHeader>
              <DrawerTitle className="text-red-600">Eliminar Pedido {pedidoData.numero}</DrawerTitle>
              <DrawerDescription>
                Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con este pedido.
              </DrawerDescription>
            </DrawerHeader>
            
            <div className="px-4 pb-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium text-sm">¡Cuidado!</span>
                </div>
                <p className="text-sm text-red-600">
                  Se eliminarán permanentemente:
                </p>
                <ul className="text-xs text-red-600 mt-2 ml-4 list-disc space-y-1">
                  <li>El pedido principal</li>
                  <li>Todos los productos del pedido (order_items)</li>
                  <li>Información de pagos (order_payments)</li>
                  <li>Seguimiento del pedido (order_tracking)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-delete">
                  Para confirmar, escribe el número del pedido: <span className="font-mono font-bold">{pedidoData.numero}</span>
                </Label>
                <Input
                  id="confirm-delete"
                  type="text"
                  placeholder={`Escribe ${pedidoData.numero}`}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
            
            <DrawerFooter className="px-4 pb-4">
              <div className="flex gap-3">
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1 h-11 text-base">
                    Cancelar
                  </Button>
                </DrawerClose>
                <Button 
                  variant="destructive"
                  onClick={handleDeletePedido}
                  disabled={isDeleting || deleteConfirmText !== pedidoData.numero}
                  className="flex-1 h-11 text-base"
                >
                  {isDeleting ? 'Eliminando...' : 'Eliminar Definitivamente'}
                </Button>
              </div>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">Eliminar Pedido {pedidoData.numero}</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. Se eliminarán todos los datos relacionados con este pedido.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700 mb-2">
                  <Trash2 className="w-4 h-4" />
                  <span className="font-medium text-sm">¡Cuidado!</span>
                </div>
                <p className="text-sm text-red-600">
                  Se eliminarán permanentemente:
                </p>
                <ul className="text-xs text-red-600 mt-2 ml-4 list-disc space-y-1">
                  <li>El pedido principal</li>
                  <li>Todos los productos del pedido (order_items)</li>
                  <li>Información de pagos (order_payments)</li>
                  <li>Seguimiento del pedido (order_tracking)</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-delete-desktop">
                  Para confirmar, escribe el número del pedido: <span className="font-mono font-bold">{pedidoData.numero}</span>
                </Label>
                <Input
                  id="confirm-delete-desktop"
                  type="text"
                  placeholder={`Escribe ${pedidoData.numero}`}
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteModal(false)}
                className="h-10 text-sm"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDeletePedido}
                disabled={isDeleting || deleteConfirmText !== pedidoData.numero}
                className="h-10 text-sm"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Definitivamente'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}