"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ArrowLeftIcon, CreditCard, Smartphone, Landmark, Globe, CheckCircle, Clock, Package, Truck, Home, MapPin, Printer, Edit, User, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
    direccion?: string
  }
  metodoPago: 'pago_movil' | 'transferencia_bancaria' | 'cuenta_internacional'
  estado: 'procesando' | 'preparando' | 'enviado' | 'entregado'
  repartidor_id?: string
  tipoEntrega: 'domicilio' | 'pickup'
  direccionEntrega?: string
  subtotal: number
  envio: number
  total: number
  productos: ProductoPedido[]
  bodegon: string
}

interface DetallePedidoViewProps {
  onBack: () => void
  pedido?: DetallePedido
  onEdit?: () => void
  onPrint?: () => void
}

// Mock data de repartidores
const mockRepartidores: Repartidor[] = [
  { id: '1', nombre: 'Carlos Mendoza', telefono: '+58 424-123-4567', activo: true },
  { id: '2', nombre: 'Ana García', telefono: '+58 416-987-6543', activo: true },
  { id: '3', nombre: 'Luis Rodríguez', telefono: '+58 426-555-0123', activo: true },
  { id: '4', nombre: 'María López', telefono: '+58 414-222-8888', activo: false },
  { id: '5', nombre: 'José Torres', telefono: '+58 424-111-9999', activo: true }
]

// Mock data para demo
const mockPedido: DetallePedido = {
  id: '1',
  numero: 'ORD-12345',
  fecha: '2025-01-09',
  hora: '15:03',
  cliente: {
    nombre: 'Alice Johnson',
    email: 'alice@example.com',
    direccion: '123 Main St, Anytown, AN 12345'
  },
  metodoPago: 'pago_movil',
  estado: 'enviado',
  repartidor_id: '2',
  tipoEntrega: 'domicilio',
  direccionEntrega: '123 Main St, Anytown, AN 12345',
  subtotal: 276.88,
  envio: 10.00,
  total: 286.88,
  productos: [
    {
      id: '1',
      nombre: 'Wireless Headphones',
      cantidad: 2,
      precio: 25.99,
      total: 51.98
    },
    {
      id: '2',
      nombre: 'Bluetooth Speaker',
      cantidad: 1,
      precio: 49.99,
      total: 49.99
    },
    {
      id: '3',
      nombre: 'Smartphone Case',
      cantidad: 3,
      precio: 15.99,
      total: 47.97
    },
    {
      id: '4',
      nombre: 'USB-C Cable',
      cantidad: 2,
      precio: 12.50,
      total: 25.00
    },
    {
      id: '5',
      nombre: 'Wireless Charger',
      cantidad: 1,
      precio: 35.99,
      total: 35.99
    },
    {
      id: '6',
      nombre: 'Power Bank',
      cantidad: 1,
      precio: 29.99,
      total: 29.99
    },
    {
      id: '7',
      nombre: 'Screen Protector',
      cantidad: 4,
      precio: 8.99,
      total: 35.96
    }
  ],
  bodegon: 'Bodegón Central'
}

function getMetodoPagoInfo(metodo: DetallePedido['metodoPago']) {
  switch (metodo) {
    case 'pago_movil':
      return {
        icon: Smartphone,
        label: 'Pago Móvil',
        detail: 'Smartphone ending in ****'
      }
    case 'transferencia_bancaria':
      return {
        icon: Landmark,
        label: 'Transferencia Bancaria',
        detail: 'Bank transfer'
      }
    case 'cuenta_internacional':
      return {
        icon: Globe,
        label: 'Cuenta Internacional',
        detail: 'International account'
      }
  }
}

function getEstadoInfo(estado: DetallePedido['estado']) {
  const estados = [
    { key: 'procesando', label: 'Processing', icon: Clock, completed: true },
    { key: 'preparando', label: 'Shipped', icon: Package, completed: true },
    { key: 'enviado', label: 'Out for Delivery', icon: Truck, completed: true },
    { key: 'entregado', label: 'Delivered', icon: CheckCircle, completed: false }
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
  onPrint
}: DetallePedidoViewProps) {
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false)
  const [editEstado, setEditEstado] = useState<string>('')
  const [editRepartidor, setEditRepartidor] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para el indicador de scroll
  const [showScrollIndicator, setShowScrollIndicator] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Usar mock data si no se proporciona pedido o si pedido es null
  const pedidoData = pedido || mockPedido
  
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
    if (onEdit) {
      onEdit()
    } else {
      // Abrir modal con datos actuales
      setEditEstado(pedidoData.estado)
      setEditRepartidor(pedidoData.repartidor_id || 'sin_asignar')
      setShowEditModal(true)
    }
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
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Aquí iría la llamada real a la API para actualizar el pedido
      console.log('Actualizando pedido:', {
        id: pedidoData.id,
        estado: editEstado,
        repartidor_id: editRepartidor === 'sin_asignar' ? null : editRepartidor
      })
      
      toast.success('Pedido actualizado exitosamente')
      setShowEditModal(false)
      
      // Aquí podrías actualizar los datos del pedido en el estado
      
    } catch (error) {
      toast.error('Error al actualizar el pedido')
    } finally {
      setIsSubmitting(false)
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
            <SelectItem value="procesando">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                Procesando
              </div>
            </SelectItem>
            <SelectItem value="preparando">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                Preparando
              </div>
            </SelectItem>
            <SelectItem value="enviado">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Enviado
              </div>
            </SelectItem>
            <SelectItem value="entregado">
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
              <div>
                <h4 className="font-medium text-sm mb-2">Información del Cliente</h4>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{pedidoData.cliente.nombre}</p>
                  {pedidoData.cliente.email && (
                    <p className="text-muted-foreground">{pedidoData.cliente.email}</p>
                  )}
                  {pedidoData.cliente.direccion && (
                    <p className="text-muted-foreground">{pedidoData.cliente.direccion}</p>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-sm mb-2">Método de Pago</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border">
                  <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-100">
                    <MetodoPagoIcon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{metodoPago.label}</p>
                    <p className="text-xs text-muted-foreground">{metodoPago.detail}</p>
                  </div>
                </div>
              </div>
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
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    Shipped
                  </Badge>
                  <span className="text-sm text-muted-foreground ml-2">
                    on December 23, 2024
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
        <div className="flex justify-end gap-3">
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
    </div>
  )
}