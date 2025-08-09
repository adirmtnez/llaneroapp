"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Download, Smartphone, Landmark, Globe, Clock, CheckCircle, Truck, Package, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
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
}

// Mock data - esto vendrá de Supabase
const mockPedidos: Pedido[] = [
  {
    id: '1',
    numero: 'TEZ7ATAQ4D',
    total: 300.00,
    estado: 'entregado',
    metodo_pago: 'pago_movil',
    fecha_pedido: '2023-07-03',
    hora_pedido: '15:03',
    bodegon_nombre: 'Bodegón Central'
  },
  {
    id: '2', 
    numero: 'TETDZR3PA6',
    total: 450.00,
    estado: 'preparando',
    metodo_pago: 'transferencia_bancaria',
    fecha_pedido: '2023-06-14',
    hora_pedido: '21:43',
    bodegon_nombre: 'Bodegón Norte'
  },
  {
    id: '3',
    numero: 'TEGNVP9SAN', 
    total: 200.00,
    estado: 'procesando',
    metodo_pago: 'cuenta_internacional',
    fecha_pedido: '2023-06-14',
    hora_pedido: '18:59',
    bodegon_nombre: 'Bodegón Sur'
  },
  {
    id: '4',
    numero: 'TFEKFQLLDS',
    total: 1000.00,
    estado: 'enviado',
    metodo_pago: 'pago_movil',
    fecha_pedido: '2023-06-14',
    hora_pedido: '18:45',
    bodegon_nombre: 'Bodegón Central'
  },
  {
    id: '5',
    numero: 'TC9Y6PYZE4',
    total: 1000.00,
    estado: 'entregado',
    metodo_pago: 'transferencia_bancaria',
    fecha_pedido: '2023-06-14',
    hora_pedido: '18:42',
    bodegon_nombre: 'Bodegón Este'
  },
  {
    id: '6',
    numero: 'CERVEZA001',
    total: 120.00,
    estado: 'entregado',
    metodo_pago: 'pago_movil',
    fecha_pedido: '2023-06-24',
    hora_pedido: '17:17',
    bodegon_nombre: 'Cerveza Duff'
  }
]

function getEstadoConfig(estado: Pedido['estado']) {
  switch (estado) {
    case 'procesando':
      return {
        icon: Clock,
        label: 'Procesando',
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-gray-100 text-gray-700 hover:bg-gray-100'
      }
    case 'preparando':
      return {
        icon: Package,
        label: 'Preparando',
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
      }
    case 'enviado':
      return {
        icon: Truck,
        label: 'Enviado',
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-blue-100 text-blue-700 hover:bg-blue-100'
      }
    case 'entregado':
      return {
        icon: CheckCircle,
        label: 'Entregado',
        bgColor: 'bg-gray-100',
        iconColor: 'text-gray-600',
        badgeColor: 'bg-green-100 text-green-700 hover:bg-green-100'
      }
  }
}

function getMetodoPagoIcon(metodo: Pedido['metodo_pago']) {
  switch (metodo) {
    case 'pago_movil':
      return { type: 'icon', component: Smartphone }
    case 'transferencia_bancaria':
      return { type: 'icon', component: Landmark }
    case 'cuenta_internacional':
      return { type: 'icon', component: Globe }
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

export function BodegonesPedView() {
  const [pedidos, setPedidos] = useState<Pedido[]>(mockPedidos)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>(pedidos)
  
  // Agrupar pedidos por fecha
  const pedidosAgrupados = filteredPedidos.reduce((acc, pedido) => {
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

  // Filtrar pedidos
  useEffect(() => {
    let filtered = pedidos
    
    if (searchTerm) {
      filtered = pedidos.filter(pedido => 
        pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pedido.bodegon_nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredPedidos(filtered)
  }, [searchTerm, pedidos])

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
        {fechasOrdenadas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron pedidos
          </div>
        )}
        
        {fechasOrdenadas.map(fecha => (
          <div key={fecha} className="space-y-4">
            {/* Separador de fecha */}
            <h3 className="text-sm font-medium text-muted-foreground px-1">
              {formatFecha(fecha)}
            </h3>
            
            {/* Pedidos de esta fecha */}
            <div className="space-y-2">
              {pedidosAgrupados[fecha].map(pedido => {
                const estadoConfig = getEstadoConfig(pedido.estado)
                const metodoPagoIcon = getMetodoPagoIcon(pedido.metodo_pago)
                
                return (
                  <Card key={pedido.id} className="hover:shadow-md transition-shadow cursor-pointer py-0">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center space-x-3">
                          {/* Icono de método de pago en contenedor rectangular */}
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                            {React.createElement(metodoPagoIcon.component, { className: "h-4 w-4 text-gray-600" })}
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
                              <span className="text-muted-foreground">•</span>
                              <p className="text-xs text-muted-foreground">
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
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
    </div>
  )
}