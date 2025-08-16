import { nuclearSelect, nuclearInsert, nuclearUpdate, nuclearDelete } from './nuclear-client'

export interface CartItem {
  id: string
  created_by: string
  quantity: number
  price: number
  bodegon_product_id: string | null
  restaurant_product_id: string | null
  name_snapshot: string
  order_id: string | null
  created_at: string
  updated_at: string
}

export interface CartProductDetails {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  order_item_id: string
}

// Cargar items del carrito del usuario
export async function loadUserCart(userId: string) {
  try {
    const { data, error } = await nuclearSelect(
      'order_item',
      `*, 
       bodegon_products(id, name, price, image_gallery_urls)`,
      { 
        created_by: userId,
        order_id: null // Solo items que no están en un pedido confirmado
      }
    )

    if (error) {
      console.error('Error cargando carrito:', error)
      return { cartItems: [], error }
    }

    // Transformar a formato esperado por el componente
    const cartItems: CartProductDetails[] = (data || []).map((item: any) => ({
      id: item.bodegon_products?.id || item.bodegon_product_id || item.id,
      name: item.bodegon_products?.name || item.name_snapshot || 'Producto sin nombre',
      price: item.bodegon_products?.price || item.unit_price || 0,
      quantity: item.quantity || 1,
      image: item.bodegon_products?.image_gallery_urls?.[0] || '',
      order_item_id: item.id
    }))

    return { cartItems, error: null }
  } catch (error) {
    console.error('Error en loadUserCart:', error)
    return { cartItems: [], error: 'Error cargando carrito' }
  }
}

// Agregar producto al carrito
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
  price: number,
  productName: string,
  isBodegon: boolean = true
) {
  try {
    console.log('🛒 Agregando al carrito:', {
      userId,
      productId,
      quantity,
      price,
      productName,
      isBodegon
    })

    // Verificar si el producto ya está en el carrito
    const { data: existing } = await nuclearSelect(
      'order_item',
      '*',
      {
        created_by: userId,
        [isBodegon ? 'bodegon_product_id' : 'restaurant_product_id']: productId,
        order_id: null
      }
    )

    console.log('🔍 Producto existente en carrito:', existing)

    if (existing && existing.length > 0) {
      // Actualizar cantidad si ya existe
      console.log('📝 Actualizando cantidad existente')
      return await updateCartItemQuantity(existing[0].id, existing[0].quantity + quantity)
    } else {
      // Crear nuevo item
      const insertData = {
        created_by: userId,
        quantity,
        unit_price: price,
        name_snapshot: productName,
        order_id: null,
        ...(isBodegon 
          ? { bodegon_product_id: productId, restaurant_product_id: null }
          : { restaurant_product_id: productId, bodegon_product_id: null }
        )
      }

      console.log('➕ Creando nuevo order_item:', insertData)

      const { data, error } = await nuclearInsert('order_item', insertData, '*')

      console.log('📊 Resultado insert:', { data, error })

      if (error) {
        console.error('❌ Error agregando al carrito:', error)
        return { success: false, error }
      }

      console.log('✅ Producto agregado exitosamente:', data)
      return { success: true, data, error: null }
    }
  } catch (error) {
    console.error('💥 Error en addToCart:', error)
    return { success: false, error: 'Error agregando producto al carrito' }
  }
}

// Actualizar cantidad de un item del carrito
export async function updateCartItemQuantity(orderItemId: string, newQuantity: number) {
  try {
    if (newQuantity <= 0) {
      return await removeFromCart(orderItemId)
    }

    const { data, error } = await nuclearUpdate(
      'order_item',
      orderItemId,
      { 
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      },
      '*'
    )

    if (error) {
      console.error('Error actualizando cantidad:', error)
      return { success: false, error }
    }

    return { success: true, data, error: null }
  } catch (error) {
    console.error('Error en updateCartItemQuantity:', error)
    return { success: false, error: 'Error actualizando cantidad' }
  }
}

// Remover item del carrito
export async function removeFromCart(orderItemId: string) {
  try {
    const { error } = await nuclearDelete('order_item', orderItemId)

    if (error) {
      console.error('Error removiendo del carrito:', error)
      return { success: false, error }
    }

    return { success: true, error: null }
  } catch (error) {
    console.error('Error en removeFromCart:', error)
    return { success: false, error: 'Error removiendo producto del carrito' }
  }
}

// Limpiar todo el carrito del usuario
export async function clearUserCart(userId: string) {
  try {
    // Obtener todos los items del carrito del usuario
    const { data: cartItems } = await nuclearSelect(
      'order_item',
      'id',
      { 
        created_by: userId,
        order_id: null 
      }
    )

    if (!cartItems || cartItems.length === 0) {
      return { success: true, error: null }
    }

    // Eliminar todos los items
    const deletePromises = cartItems.map((item: any) => 
      nuclearDelete('order_item', item.id)
    )

    await Promise.all(deletePromises)

    return { success: true, error: null }
  } catch (error) {
    console.error('Error en clearUserCart:', error)
    return { success: false, error: 'Error limpiando carrito' }
  }
}

// Buscar item del carrito por producto
export async function findCartItem(userId: string, productId: string, isBodegon: boolean = true) {
  try {
    const { data, error } = await nuclearSelect(
      'order_item',
      '*',
      {
        created_by: userId,
        [isBodegon ? 'bodegon_product_id' : 'restaurant_product_id']: productId,
        order_id: null
      }
    )

    if (error) {
      console.error('Error buscando item del carrito:', error)
      return { item: null, error }
    }

    return { item: data?.[0] || null, error: null }
  } catch (error) {
    console.error('Error en findCartItem:', error)
    return { item: null, error: 'Error buscando item del carrito' }
  }
}