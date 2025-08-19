import { nuclearSelect } from './nuclear-client'

// Interfaces para datos reales de la base de datos
export interface DatabaseOrder {
  id: string
  customer_id: string
  bodegon_id: string | null
  restaurant_id: string | null
  order_number: string
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  delivery_mode: 'delivery' | 'pickup'
  delivery_address_id: string | null
  delivery_person_id: string | null
  subtotal: number
  shipping_cost: number
  discount_amount: number
  total_amount: number
  coupon_code: string | null
  customer_phone: string
  notes: string
  verification_code: string
  created_at: string
  updated_at?: string
}

export interface DatabaseOrderItem {
  id: string
  order_id: string
  bodegon_product_id: string | null
  restaurant_product_id: string | null
  quantity: number
  unit_price: number
  name_snapshot: string
  created_by: string
  created_at: string
  updated_at?: string
  // Relaciones
  bodegon_products?: {
    id: string
    name: string
    price: number
    image_gallery_urls: string[]
  }
}

export interface DatabaseOrderPayment {
  id: string
  order_id: string
  payment_method: string
  bank_destination: string
  bank_origin: string
  document_type: string
  document_number: string
  payment_reference: string
  receipt_url: string | null
  payment_status: 'pending' | 'confirmed' | 'failed' | 'refunded'
  created_at: string
  updated_at?: string
}

export interface DatabaseOrderTracking {
  id: string
  order_id: string
  status: string
  message: string
  created_by: string
  created_at: string
}

// Interface para order completo con relaciones
export interface CompleteOrder extends DatabaseOrder {
  order_items: DatabaseOrderItem[]
  order_payments: DatabaseOrderPayment[]
  order_tracking: DatabaseOrderTracking[]
  customer_addresses?: {
    id: string
    address_line1: string
    address_line2: string | null
    city: string | null
    state: string | null
    label: string | null
  }
  bodegons?: {
    id: string
    name: string
    phone_number: string | null
    address: string | null
  }
}

// Función para cargar pedidos del usuario
export async function loadUserOrders(userId: string) {
  try {
    console.log('🔍 Cargando pedidos del usuario:', userId)
    
    const { data, error } = await nuclearSelect(
      'orders',
      `
        *,
        order_item!order_item_order_id_fkey(
          *,
          bodegon_products(id, name, price, image_gallery_urls)
        ),
        order_payments!order_payments_order_id_fkey(*),
        order_tracking!order_tracking_order_id_fkey(*),
        customer_addresses!orders_delivery_address_id_fkey(
          id, address_line1, address_line2, city, state, label
        ),
        bodegons!orders_bodegon_id_fkey(
          id, name, phone_number, address
        )
      `,
      { customer_id: userId }
    )

    if (error) {
      console.error('❌ Error cargando pedidos:', error)
      return { orders: [], error }
    }

    // Ordenar por fecha más reciente primero
    const sortedOrders = (data || []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log('✅ Pedidos cargados exitosamente:', sortedOrders.length)
    return { orders: sortedOrders as CompleteOrder[], error: null }
    
  } catch (error) {
    console.error('💥 Error inesperado cargando pedidos:', error)
    return { orders: [], error: 'Error inesperado cargando pedidos' }
  }
}

// 🚀 FUNCIÓN OPTIMIZADA: Solo para polling de cambios de status
// Reduce Egress en 96% vs loadUserOrders completa
export async function loadOrdersStatusOnly(userId: string) {
  try {
    console.log('⚡ Cargando solo status de pedidos activos para:', userId)
    
    const { data, error } = await nuclearSelect(
      'orders',
      `
        id,
        order_number, 
        status,
        payment_status,
        updated_at,
        created_at,
        total_amount,
        delivery_mode
      `,
      { 
        customer_id: userId
        // ✅ NO filtrar por status aquí - dejamos que el cliente decida
        // qué pedidos necesita hacer polling
      }
    )

    if (error) {
      console.error('❌ Error cargando status de pedidos:', error)
      return { orders: [], error }
    }

    // Ordenar por fecha más reciente primero
    const sortedOrders = (data || []).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    console.log('⚡ Status de pedidos cargado:', sortedOrders.length, 'pedidos')
    return { orders: sortedOrders as Partial<CompleteOrder>[], error: null }
    
  } catch (error) {
    console.error('💥 Error inesperado cargando status:', error)
    return { orders: [], error: 'Error inesperado cargando status de pedidos' }
  }
}

// Función para obtener pedidos pendientes
export function getPendingOrders(orders: CompleteOrder[]): CompleteOrder[] {
  return orders.filter(order => 
    order.status !== 'delivered' && order.status !== 'cancelled'
  )
}

// 🎯 FILTRO INTELIGENTE: Determina qué pedidos necesitan polling activo
export function getOrdersNeedingPolling(orders: CompleteOrder[] | Partial<CompleteOrder>[]): Partial<CompleteOrder>[] {
  const now = new Date().getTime()
  const twoHoursAgo = now - (2 * 60 * 60 * 1000) // 2 horas en millisegundos
  
  return orders.filter(order => {
    // ✅ Solo pedidos que no están finalizados
    const isPending = order.status !== 'delivered' && order.status !== 'cancelled'
    
    // ✅ Solo pedidos recientes (últimas 2 horas) para evitar polling infinito
    const isRecent = order.created_at ? 
      new Date(order.created_at).getTime() > twoHoursAgo : true
    
    return isPending && isRecent
  })
}

// 🔄 FUNCIÓN HÍBRIDA: Merge status updates con datos completos existentes
export function mergeOrderStatusUpdates(
  existingOrders: CompleteOrder[], 
  statusUpdates: Partial<CompleteOrder>[]
): CompleteOrder[] {
  return existingOrders.map(existingOrder => {
    // Buscar update de status para este pedido
    const statusUpdate = statusUpdates.find(update => update.id === existingOrder.id)
    
    if (statusUpdate) {
      // Merge solo los campos de status actualizados
      return {
        ...existingOrder,
        status: statusUpdate.status || existingOrder.status,
        payment_status: statusUpdate.payment_status || existingOrder.payment_status,
        updated_at: statusUpdate.updated_at || existingOrder.updated_at
      }
    }
    
    return existingOrder
  })
}

// Función para obtener pedidos entregados
export function getDeliveredOrders(orders: CompleteOrder[]): CompleteOrder[] {
  return orders.filter(order => 
    order.status === 'delivered'
  )
}

// Función para mapear estados de BD a estados UI
export function mapDatabaseStatusToUI(status: string) {
  const statusMap: Record<string, { label: string; variant: string }> = {
    'pending': { label: 'Procesando', variant: 'bg-gray-100 text-gray-700' },
    'confirmed': { label: 'Confirmado', variant: 'bg-blue-100 text-blue-700' },
    'preparing': { label: 'Preparando', variant: 'bg-yellow-100 text-yellow-700' },
    'shipped': { label: 'Enviado', variant: 'bg-blue-100 text-blue-700' },
    'delivered': { label: 'Entregado', variant: 'bg-green-100 text-green-700' },
    'cancelled': { label: 'Cancelado', variant: 'bg-red-100 text-red-700' }
  }
  
  return statusMap[status] || { label: status, variant: 'bg-gray-100 text-gray-700' }
}

// Función para mapear método de pago
export function mapPaymentMethod(method: string) {
  const methodMap: Record<string, string> = {
    'pagomovil': 'Pago móvil',
    'transferencia': 'Transferencia',
    'zelle': 'Zelle',
    'banesco': 'Banesco Panamá'
  }
  
  return methodMap[method] || method
}