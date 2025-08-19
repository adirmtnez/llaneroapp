import { nuclearInsert, nuclearUpdate, nuclearSelect } from './nuclear-client'

// Generar código de verificación de 4 dígitos
export const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Generar número de pedido único
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6)
  return `LL${timestamp}`
}

// Interface para datos del pedido
export interface CreateOrderData {
  customerId: string
  bodegonId?: string
  restaurantId?: string
  deliveryMode: 'delivery' | 'pickup'
  deliveryAddressId?: string
  subtotal: number
  shippingCost: number
  discountAmount: number
  totalAmount: number
  couponCode?: string
  customerPhone: string
  notes?: string
  paymentData: {
    paymentMethod: string
    bankDestination: string
    bankOrigin: string
    documentType: string
    documentNumber: string
    paymentReference: string
    receiptUrl?: string
  }
}

// Interface para el resultado
export interface CreateOrderResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  verificationCode?: string
  error?: string
}

// Función principal para crear pedido completo
export const createCompleteOrder = async (orderData: CreateOrderData): Promise<CreateOrderResult> => {
  try {
    console.log('🚀 Iniciando creación de pedido completo:', orderData)

    // 1. Generar códigos únicos
    const orderNumber = generateOrderNumber()
    const verificationCode = generateVerificationCode()

    console.log('📋 Códigos generados:', { orderNumber, verificationCode })

    // 2. Crear el pedido principal
    const { data: orderResult, error: orderError } = await nuclearInsert(
      'orders',
      {
        customer_id: orderData.customerId,
        bodegon_id: orderData.bodegonId || '00000000-0000-0000-0000-000000000001', // Bodegón por defecto si no hay preferido
        restaurant_id: orderData.restaurantId || null,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        delivery_mode: orderData.deliveryMode,
        delivery_address_id: orderData.deliveryAddressId || null,
        subtotal: Math.max(0, orderData.subtotal), // Asegurar valor positivo
        shipping_cost: Math.max(0, orderData.shippingCost), // Asegurar valor positivo
        discount_amount: Math.max(0, orderData.discountAmount), // Asegurar valor positivo
        total_amount: Math.max(0, orderData.totalAmount), // Asegurar valor positivo
        coupon_code: orderData.couponCode || null,
        customer_phone: orderData.customerPhone || '', // Asegurar string no vacío
        notes: orderData.notes || '',
        verification_code: verificationCode,
        created_at: new Date().toISOString()
      },
      '*'
    )

    if (orderError || !orderResult || orderResult.length === 0) {
      console.error('❌ Error creando pedido:', orderError)
      console.error('📋 Datos enviados:', {
        customer_id: orderData.customerId,
        bodegon_id: orderData.bodegonId || null,
        restaurant_id: orderData.restaurantId || null,
        order_number: orderNumber,
        status: 'pending',
        payment_status: 'pending',
        delivery_mode: orderData.deliveryMode,
        delivery_address_id: orderData.deliveryAddressId || null,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost,
        discount_amount: orderData.discountAmount,
        total_amount: orderData.totalAmount,
        coupon_code: orderData.couponCode || null,
        customer_phone: orderData.customerPhone,
        notes: orderData.notes || null,
        verification_code: verificationCode,
        created_at: new Date().toISOString()
      })
      return { success: false, error: `Error al crear el pedido: ${orderError?.message || 'Error desconocido'}` }
    }

    const orderId = orderResult[0].id
    console.log('✅ Pedido creado con ID:', orderId)

    // 3. Migrar items del carrito temporal al pedido
    // Necesitamos usar executeNuclearQuery para hacer un UPDATE con WHERE personalizado
    const { executeNuclearQuery } = await import('./nuclear-client')
    
    const { error: itemsError } = await executeNuclearQuery(
      async (client) => {
        return await client
          .from('order_item')
          .update({ 
            order_id: orderId,
            invoiced: true // ✅ Marcar como facturado al crear el pedido
          })
          .eq('created_by', orderData.customerId)
          .is('order_id', null)
          .eq('invoiced', false) // Solo actualizar items no facturados
      }
    )

    if (itemsError) {
      console.error('❌ Error migrando items del carrito:', itemsError)
      return { success: false, error: 'Error al procesar items del carrito' }
    }

    console.log('✅ Items migrados al pedido')

    // 4. Registrar detalles del pago
    const { error: paymentError } = await nuclearInsert(
      'order_payments',
      {
        order_id: orderId,
        payment_method: orderData.paymentData.paymentMethod,
        bank_destination: orderData.paymentData.bankDestination,
        bank_origin: orderData.paymentData.bankOrigin,
        document_type: orderData.paymentData.documentType,
        document_number: orderData.paymentData.documentNumber,
        payment_reference: orderData.paymentData.paymentReference,
        receipt_url: orderData.paymentData.receiptUrl || null,
        payment_status: 'pending'
      }
    )

    if (paymentError) {
      console.error('❌ Error registrando pago:', paymentError)
      return { success: false, error: 'Error al registrar el pago' }
    }

    console.log('✅ Pago registrado')

    // 5. Crear registro inicial de tracking
    const { error: trackingError } = await nuclearInsert(
      'order_tracking',
      {
        order_id: orderId,
        status: 'received',
        message: 'Pedido recibido y confirmado',
        created_by: orderData.customerId
      }
    )

    if (trackingError) {
      console.error('❌ Error creando tracking:', trackingError)
      // No retornamos error aquí porque el pedido ya fue creado exitosamente
    } else {
      console.log('✅ Tracking inicial creado')
    }

    // 6. Actualizar estado del pedido a confirmado
    const { error: updateError } = await nuclearUpdate(
      'orders',
      orderId,
      { 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      }
    )

    if (updateError) {
      console.error('❌ Error actualizando estado del pedido:', updateError)
      // No retornamos error porque el pedido ya fue creado
    } else {
      console.log('✅ Pedido confirmado')
    }

    console.log('🎉 Pedido creado exitosamente:', {
      orderId,
      orderNumber,
      verificationCode
    })

    return {
      success: true,
      orderId,
      orderNumber,
      verificationCode
    }

  } catch (error) {
    console.error('💥 Error inesperado creando pedido:', error)
    return { 
      success: false, 
      error: 'Error inesperado al procesar el pedido' 
    }
  }
}

// Función para obtener detalles de un pedido
export const getOrderDetails = async (orderId: string) => {
  try {
    const { data, error } = await nuclearSelect(
      'orders',
      `
        *,
        order_item(*, bodegon_products(id, name, price, image_gallery_urls)),
        order_payments(*),
        order_tracking(*),
        customer_addresses(*)
      `,
      { id: orderId }
    )

    if (error) {
      console.error('Error loading order details:', error)
      return { data: null, error }
    }

    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { data: null, error }
  }
}