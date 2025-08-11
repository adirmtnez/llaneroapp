'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Bike, Warehouse, MapPin, ChevronDown, Check, Plus, Smartphone, Landmark, Globe, Upload, FileText, CreditCard, X, Loader2, CheckCircle, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useAuth } from '@/contexts/auth-context'
import { nuclearSelect, nuclearUpdate } from '@/utils/nuclear-client'

interface CartItem {
  id: string | number
  name: string
  price: number
  quantity: number
  image?: string
}

interface CheckoutViewProps {
  onBack: () => void
  onNavigateHome?: () => void
  selectedBodegon?: string
  currency?: string
}

// Opciones de métodos de pago
const paymentMethods = [
  {
    id: 'pagomovil',
    name: 'Pago móvil',
    icon: Smartphone,
    color: 'bg-blue-500',
    selected: true
  },
  {
    id: 'transferencia',
    name: 'Transferencia',
    icon: Landmark,
    color: 'bg-blue-600',
    selected: false
  },
  {
    id: 'zelle',
    name: 'Zelle',
    icon: Globe,
    color: 'bg-purple-600',
    selected: false
  },
  {
    id: 'banesco',
    name: 'Banesco Panamá',
    icon: Globe,
    color: 'bg-green-600',
    selected: false
  }
]

// Bancos disponibles
const availableBanks = [
  { id: 'banesco', name: 'Banesco', phone: '0134', info: 'C.I/R.I.F: 0' },
  { id: 'mercantil', name: 'Mercantil', phone: '0105', info: 'Teléfono: 0' },
  { id: 'venezuela', name: 'Banco de Venezuela', phone: '0102', info: 'C.I/R.I.F: 0' },
  { id: 'provincial', name: 'BBVA Provincial', phone: '0108', info: 'C.I/R.I.F: 0' }
]

// Mock de direcciones guardadas del usuario
const savedAddresses = [
  {
    id: '1',
    name: 'Casa',
    address: 'Av. Principal #123, Urbanización Los Jardines',
    city: 'Caracas',
    isDefault: true
  },
  {
    id: '2',
    name: 'Trabajo',
    address: 'Torre Empresarial, Piso 15, Oficina 1504',
    city: 'Caracas',
    isDefault: false
  },
  {
    id: '3',
    name: 'Casa de mamá',
    address: 'Calle 42 con Av. 18, Casa #25',
    city: 'Valencia',
    isDefault: false
  }
]

export function CheckoutView({ onBack, onNavigateHome, selectedBodegon = 'La Estrella', currency = '$' }: CheckoutViewProps) {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loadingCart, setLoadingCart] = useState(true)
  const [isViewLoaded, setIsViewLoaded] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number, type: 'percentage' | 'fixed' } | null>(null)
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('pagomovil')
  const [showAddressDrawer, setShowAddressDrawer] = useState(false)
  const [showContactDrawer, setShowContactDrawer] = useState(false)
  const [contactData, setContactData] = useState({
    phonePrefix: '0414',
    phoneNumber: ''
  })
  const [contactDataInitialized, setContactDataInitialized] = useState(false)
  const [showPaymentSteps, setShowPaymentSteps] = useState(false)
  const [paymentStepsData, setPaymentStepsData] = useState({
    selectedBank: '',
    documentType: 'V',
    documentNumber: '',
    paymentReference: '',
    issuingBank: '',
    receipt: null as File | null
  })
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  
  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsViewLoaded(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])
  
  // Cargar items del carrito directamente desde la base de datos
  useEffect(() => {
    const loadCartItems = async () => {
      if (!user?.auth_user?.id) {
        console.log('👤 Usuario no autenticado - carrito vacío')
        setCartItems([])
        setLoadingCart(false)
        return
      }

      try {
        console.log('🔍 Cargando items del carrito para usuario:', user.auth_user.id)
        const { data, error } = await nuclearSelect(
          'order_item',
          `*, 
           bodegon_products!bodegon_product_item(id, name, price, image_gallery_urls)`,
          { 
            created_by: user.auth_user.id,
            order: null // Solo items que no están en un pedido confirmado
          }
        )

        if (error) {
          console.error('❌ Error cargando carrito:', error)
          setCartItems([])
          return
        }

        // Transformar a formato CartItem
        const transformedItems: CartItem[] = (data || []).map((item: any) => ({
          id: item.bodegon_products?.id || item.id,
          name: item.bodegon_products?.name || 'Producto sin nombre',
          price: item.bodegon_products?.price || 0,
          quantity: item.quantity || 1,
          image: item.bodegon_products?.image_gallery_urls?.[0] || ''
        }))

        console.log('✅ Items del carrito cargados:', transformedItems)
        setCartItems(transformedItems)

      } catch (error) {
        console.error('💥 Error inesperado cargando carrito:', error)
        setCartItems([])
      } finally {
        setLoadingCart(false)
      }
    }

    loadCartItems()
  }, [user?.auth_user?.id])
  
  // Simulación de cupones disponibles (más tarde conectar con base de datos)
  const availableCoupons = [
    { code: 'DESCUENTO10', discount: 10, type: 'percentage' as const, description: '10% de descuento' },
    { code: 'SAVE5', discount: 5, type: 'fixed' as const, description: '$5 de descuento' },
    { code: 'WELCOME15', discount: 15, type: 'percentage' as const, description: '15% descuento de bienvenida' }
  ]
  
  // Función para aplicar cupón (simulación)
  useEffect(() => {
    // Simular que se aplicó un cupón (puedes modificar esto)
    // Por ejemplo, si hay productos en el carrito, aplicar el primer cupón
    if (cartItems.length > 0 && !appliedCoupon && !loadingCart) {
      // Simular aplicar cupón de bienvenida
      setAppliedCoupon(availableCoupons[2]) // WELCOME15
      console.log('🎫 Cupón aplicado automáticamente:', availableCoupons[2])
    }
  }, [cartItems.length, appliedCoupon, loadingCart])
  
  // Cargar datos de teléfono del usuario automáticamente (solo una vez)
  useEffect(() => {
    console.log('🔍 Debug user object:', user)
    console.log('🔍 user.profile?.phone_dial:', user?.profile?.phone_dial)
    console.log('🔍 user.profile?.phone_number:', user?.profile?.phone_number)
    console.log('🔍 contactDataInitialized:', contactDataInitialized)
    
    if (user?.profile && !contactDataInitialized) {
      const updates: any = {}
      
      // Cargar phone_dial si existe
      if (user.profile.phone_dial) {
        updates.phonePrefix = user.profile.phone_dial
        console.log('📞 Cargando phone_dial del usuario:', user.profile.phone_dial)
      }
      
      // Cargar phone_number si existe
      if (user.profile.phone_number) {
        updates.phoneNumber = user.profile.phone_number
        console.log('📞 Cargando phone_number del usuario:', user.profile.phone_number)
      }
      
      // Aplicar actualizaciones y marcar como inicializado
      if (Object.keys(updates).length > 0 || user.profile) {
        setContactData(prev => ({
          ...prev,
          ...updates
        }))
        setContactDataInitialized(true)
        console.log('✅ Datos de contacto inicializados')
      }
    }
  }, [user?.profile, contactDataInitialized])
  
  // Calcular totales del carrito con cupón de descuento
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = deliveryMode === 'delivery' ? 2.00 : 0 // Envío gratis para pickup
  
  // Calcular descuento del cupón
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.type === 'percentage'
      ? (subtotal * appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0
  
  const total = subtotal + shippingCost - couponDiscount
  
  console.log('🧮 Cálculos checkout:', { 
    cartItemsLength: cartItems.length, 
    subtotal, 
    shippingCost, 
    couponDiscount,
    appliedCoupon,
    total 
  })
  
  // Obtener dirección seleccionada o default
  const currentAddress = selectedAddress 
    ? savedAddresses.find(addr => addr.id === selectedAddress)
    : savedAddresses.find(addr => addr.isDefault)
  
  const handleSelectAddress = (address: typeof savedAddresses[0]) => {
    setSelectedAddress(address.id)
    setShowAddressDrawer(false)
  }

  // Manejar cambios en datos de contacto
  const handleContactDataChange = (field: string, value: string) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Funciones para manejar los pasos de pago
  const handlePaymentStepsDataChange = (field: string, value: string) => {
    setPaymentStepsData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileUpload = (file: File | null) => {
    setPaymentStepsData(prev => ({
      ...prev,
      receipt: file
    }))
  }

  const handleFinalSubmit = async () => {
    setIsCreatingOrder(true)
    
    console.log('✅ Realizar pedido final', {
      deliveryMode,
      selectedAddress,
      selectedPayment,
      contactData,
      paymentStepsData,
      cartItems,
      total
    })
    
    // Simular creación del pedido (2-3 segundos)
    await new Promise(resolve => setTimeout(resolve, 2500))
    
    // Generar número de pedido aleatorio
    const orderNum = `LL${Date.now().toString().slice(-6)}`
    setOrderNumber(orderNum)
    
    setIsCreatingOrder(false)
    setShowPaymentSteps(false) // Cerrar el drawer
    setOrderCreated(true) // Mostrar vista de éxito independiente
    
    // TODO: Implementar envío real del pedido a la base de datos
  }

  // Manejar envío de datos de contacto
  const handleContactSubmit = async () => {
    if (!contactData.phoneNumber.trim()) {
      console.log('❌ Número de teléfono requerido')
      return
    }

    console.log('📞 Datos de contacto a procesar:', contactData)

    // Solo actualizar datos del usuario cuando están vacíos en la BD
    if (user?.profile?.id) {
      try {
        const updates: any = {}
        
        // Solo actualizar phone_dial si está vacío en la BD
        if (!user.profile.phone_dial || user.profile.phone_dial === null) {
          updates.phone_dial = contactData.phonePrefix
          console.log('🔄 Actualizando phone_dial vacío en BD:', contactData.phonePrefix)
        } else {
          console.log('ℹ️ phone_dial ya existe en BD, no se actualiza:', user.profile.phone_dial)
        }
        
        // Solo actualizar phone_number si está vacío en la BD
        if (!user.profile.phone_number || user.profile.phone_number === null) {
          updates.phone_number = contactData.phoneNumber
          console.log('🔄 Actualizando phone_number vacío en BD:', contactData.phoneNumber)
        } else {
          console.log('ℹ️ phone_number ya existe en BD, no se actualiza:', user.profile.phone_number)
        }
        
        // Realizar actualización solo si hay datos que actualizar
        if (Object.keys(updates).length > 0) {
          console.log('💾 Guardando datos nuevos en BD:', updates)
          const { error } = await nuclearUpdate('users', user.profile.id, updates)
          if (error) {
            console.error('❌ Error actualizando datos del usuario:', error)
          } else {
            console.log('✅ Datos del usuario actualizados correctamente en BD')
          }
        } else {
          console.log('ℹ️ No hay datos nuevos que actualizar en BD')
        }
      } catch (error) {
        console.error('💥 Error inesperado actualizando usuario:', error)
      }
    }

    setShowContactDrawer(false)
    setShowPaymentSteps(true)
    
    console.log('✅ Continuar con pasos de pago', {
      deliveryMode,
      selectedAddress,
      selectedPayment,
      contactData,
      cartItems,
      total
    })
  }

  // Si el pedido fue creado exitosamente, mostrar vista de éxito
  if (orderCreated) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Success View */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          
          <div className="text-center max-w-sm w-full">
            <h1 className="text-xl font-bold text-gray-900 mb-2">¡Pedido creado exitosamente!</h1>
            <p className="text-gray-600 mb-4 text-sm">Tu pedido ha sido registrado y será procesado en breve.</p>
            
            <div className="bg-green-50 rounded-2xl p-4 mb-4">
              <p className="text-xs text-green-700 font-medium mb-1">Número de pedido</p>
              <p className="text-2xl font-bold text-green-800 mb-3">{orderNumber}</p>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">Confirmación por WhatsApp</p>
                <p className="font-semibold text-gray-900 text-sm">{contactData.phonePrefix} {contactData.phoneNumber}</p>
              </div>
            </div>

            {/* Order Status Tracking - Compacto */}
            <div className="bg-white rounded-2xl p-4 mb-4 w-full">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Estado del pedido</h3>
              
              <div className="relative">
                {/* Línea vertical conectora */}
                <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-3 relative">
                  {/* Recibido - Activo */}
                  <div className="flex items-center relative">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full mr-3 relative z-10">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-green-700 text-sm">Recibido</p>
                      <p className="text-xs text-green-600">Tu pedido ha sido confirmado</p>
                    </div>
                  </div>

                  {/* Preparando - Pendiente */}
                  <div className="flex items-center relative">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full mr-3 relative z-10">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-500 text-sm">Preparando</p>
                      <p className="text-xs text-gray-400">Preparación en proceso</p>
                    </div>
                  </div>

                  {/* Enviado - Pendiente */}
                  <div className="flex items-center relative">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full mr-3 relative z-10">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-500 text-sm">Enviado</p>
                      <p className="text-xs text-gray-400">En camino a tu dirección</p>
                    </div>
                  </div>

                  {/* Entregado - Pendiente */}
                  <div className="flex items-center relative">
                    <div className="flex items-center justify-center w-6 h-6 bg-gray-200 rounded-full mr-3 relative z-10">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-500 text-sm">Entregado</p>
                      <p className="text-xs text-gray-400">Pedido completado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => {
              // Reset completo de todos los estados
              setOrderCreated(false)
              setIsCreatingOrder(false)
              setShowPaymentSteps(false)
              setShowContactDrawer(false)
              setShowAddressDrawer(false)
              
              // Si existe onNavigateHome, usarla, sino usar onBack múltiples veces para volver al inicio
              if (onNavigateHome) {
                onNavigateHome()
              } else {
                // Fallback: usar onBack para volver al inicio
                onBack()
              }
            }}
            className="w-full max-w-sm h-11 text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-50 transition-all duration-500 ease-out ${isViewLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-10 w-10 p-0 hover:bg-gray-100 mr-3"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Modo de entrega */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modo de entrega</h2>
          
          <Card className="overflow-hidden border rounded-[20px]">
            <div className="divide-y divide-gray-200">
              {/* Delivery */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-gray-900"
                onClick={() => setDeliveryMode('delivery')}
              >
                <div className="flex items-center space-x-4">
                  <Bike className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Delivery</span>
                </div>
                
                <div className="flex items-center">
                  {deliveryMode === 'delivery' ? (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </button>

              {/* Pickup */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-gray-900"
                onClick={() => setDeliveryMode('pickup')}
              >
                <div className="flex items-center space-x-4">
                  <Warehouse className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">Pickup</span>
                </div>
                
                <div className="flex items-center">
                  {deliveryMode === 'pickup' ? (
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </button>
            </div>
          </Card>
        </div>

        {/* Información de pickup - Solo si es pickup */}
        {deliveryMode === 'pickup' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Retirar en</h2>
            
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <Warehouse className="w-5 h-5 text-gray-600" />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{selectedBodegon}</span>
                  <span className="text-sm text-gray-500">Bodegón seleccionado</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Dirección de envío - Solo si es delivery */}
        {deliveryMode === 'delivery' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Dirección de envío</h2>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-orange-600 hover:text-orange-700 p-0"
              >
                Agregar dirección
              </Button>
            </div>
            
            <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setShowAddressDrawer(true)}>
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    {currentAddress ? (
                      <>
                        <span className="font-medium text-gray-900 truncate">{currentAddress.name}</span>
                        <span className="text-sm text-gray-500 truncate">{currentAddress.address}</span>
                      </>
                    ) : (
                      <span className="text-gray-500 truncate">Selecciona una dirección</span>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
              </div>
            </Card>
          </div>
        )}

        {/* Método de pago */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Método de pago</h2>
          
          <Card className="overflow-hidden border rounded-[20px]">
            <div className="divide-y divide-gray-200">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-gray-900"
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <div className="flex items-center space-x-4">
                    <method.icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{method.name}</span>
                  </div>
                  
                  <div className="flex items-center">
                    {selectedPayment === method.id ? (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Resumen de compra */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de compra</h2>
          
          <Card className="border rounded-[20px] p-6 bg-white">
            <div className="space-y-6">
              {/* Monto total */}
              <div className="text-center pb-4 border-b border-gray-100">
                <p className="text-sm text-gray-600 mb-2">Monto total</p>
                <p className="text-3xl font-bold text-gray-900">{currency}{total.toFixed(2)}</p>
              </div>
              
              {/* Items del pedido */}
              {loadingCart ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="w-20 ml-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : cartItems.length > 0 ? (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-600 truncate">{item.name}</p>
                      </div>
                      <div className="text-right ml-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.quantity} x {currency}{item.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No hay productos en el carrito</p>
                </div>
              )}
              
              {/* Subtotales */}
              {cartItems.length > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium text-gray-900">{currency}{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Envío</span>
                    <span className="text-sm font-medium text-gray-900">
                      {deliveryMode === 'pickup' ? 'Gratis' : `${currency}${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  
                  {/* Cupón de descuento */}
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-green-600">Cupón ({appliedCoupon.code})</span>
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        -{currency}{couponDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Total final */}
              {cartItems.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-gray-900">{currency}{total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Botón de continuar - Inline después del resumen */}
          <div className="mt-6">
            <Button
              className="w-full h-11 md:h-10 text-base md:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
              onClick={() => {
                setShowContactDrawer(true)
                // Permitir que el usuario seleccione manualmente
                if (!contactDataInitialized && user?.profile) {
                  setContactDataInitialized(true)
                }
              }}
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>

      {/* Address Drawer */}
      <Drawer open={showAddressDrawer} onOpenChange={setShowAddressDrawer}>
        <DrawerContent className="flex flex-col max-h-[85vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
          <DrawerHeader className="text-left pb-4">
            <DrawerTitle className="text-lg font-semibold text-gray-900">
              Seleccionar dirección
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Lista de direcciones guardadas del usuario
            </DrawerDescription>
          </DrawerHeader>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-3 pb-6">
              {savedAddresses.map((address) => (
                <Card 
                  key={address.id} 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{address.name}</span>
                          {address.isDefault && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                              Por defecto
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 leading-tight">
                          {address.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          {address.city}
                        </p>
                      </div>
                    </div>
                    
                    {/* Check si está seleccionada */}
                    {(selectedAddress === address.id || (!selectedAddress && address.isDefault)) && (
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center ml-3">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
              
              {/* Botón agregar nueva dirección */}
              <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors border-2 border-dashed border-gray-300">
                <div className="flex items-center justify-center space-x-3 text-gray-500">
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Agregar nueva dirección</span>
                </div>
              </Card>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Contact Information Drawer */}
      <Drawer open={showContactDrawer} onOpenChange={setShowContactDrawer}>
        <DrawerContent className="flex flex-col max-h-[85vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle className="text-lg font-semibold text-gray-900">
              Antes de continuar
            </DrawerTitle>
            <DrawerDescription className="text-sm text-gray-600 mt-2">
              Usaremos tu número de teléfono para confirmar la compra y coordinar la entrega.
            </DrawerDescription>
          </DrawerHeader>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-6 pb-6">
              {/* Teléfono */}
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Teléfono
                </label>
                <div className="flex gap-2">
                  {/* Dropdown de prefijos */}
                  <Select
                    value={contactData.phonePrefix}
                    onValueChange={(value) => handleContactDataChange('phonePrefix', value)}
                  >
                    <SelectTrigger className="w-24 h-11 text-base min-h-[44px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0414">0414</SelectItem>
                      <SelectItem value="0424">0424</SelectItem>
                      <SelectItem value="0416">0416</SelectItem>
                      <SelectItem value="0426">0426</SelectItem>
                      <SelectItem value="0412">0412</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Input del número */}
                  <Input
                    type="tel"
                    placeholder="Ingrese su número"
                    value={contactData.phoneNumber}
                    onChange={(e) => handleContactDataChange('phoneNumber', e.target.value)}
                    className="flex-1 h-11 text-base min-h-[44px] bg-white"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 h-11 md:h-10 text-base md:text-sm rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowContactDrawer(false)}
                >
                  Atrás
                </Button>
                
                <Button
                  className="flex-1 h-11 md:h-10 text-base md:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
                  onClick={handleContactSubmit}
                  disabled={!contactData.phoneNumber.trim()}
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Payment Steps Drawer */}
      <Drawer open={showPaymentSteps} onOpenChange={setShowPaymentSteps}>
        <DrawerContent 
          className="flex flex-col max-h-[90vh] rounded-t-[20px] focus:outline-none focus-visible:outline-none border-none ring-0" 
          style={{ 
            backgroundColor: '#F9FAFC',
            border: 'none',
            outline: 'none',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <DrawerHeader className="text-center pb-4">
            <DrawerTitle className="text-lg font-semibold text-gray-900">
              Realizar Pago
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Pasos para completar el pago
            </DrawerDescription>
          </DrawerHeader>

          {/* Content - scrollable compacto */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            
            {/* Loading State - Creando pedido */}
            {isCreatingOrder && (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Creando tu pedido</h3>
                <p className="text-gray-600 text-sm">Procesando tu solicitud...</p>
              </div>
            )}


            {/* Form State - Formulario normal */}
            {!isCreatingOrder && (
              <Card className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="space-y-4">
                {/* Paso 1: Banco */}
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Banco destino</h3>
                  </div>
                  
                  <Select
                    value={paymentStepsData.selectedBank}
                    onValueChange={(value) => handlePaymentStepsDataChange('selectedBank', value)}
                  >
                    <SelectTrigger className="w-full h-11 text-base min-h-[44px] bg-white">
                      <SelectValue placeholder="Selecciona banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBanks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Info del banco seleccionado - compacta */}
                  {paymentStepsData.selectedBank && (
                    <div className="mt-2 p-3 bg-red-900 text-white rounded-lg text-sm">
                      {(() => {
                        const selectedBankData = availableBanks.find(bank => bank.id === paymentStepsData.selectedBank)
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Banco:</span>
                              <span className="font-medium">{selectedBankData?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>C.I/R.I.F:</span>
                              <span className="font-bold">{selectedBankData?.phone}</span>
                            </div>
                            <div className="text-xs text-red-200 mt-2 text-center">
                              Usar tasa oficial BCV
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Paso 2: Información del pago - grid compacto */}
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Datos del pago</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {/* Documento */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Tu documento
                      </label>
                      <div className="flex gap-2">
                        <Select
                          value={paymentStepsData.documentType}
                          onValueChange={(value) => handlePaymentStepsDataChange('documentType', value)}
                        >
                          <SelectTrigger className="w-16 h-11 text-base min-h-[44px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="V">V</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                            <SelectItem value="J">J</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          type="text"
                          placeholder="Número"
                          value={paymentStepsData.documentNumber}
                          onChange={(e) => handlePaymentStepsDataChange('documentNumber', e.target.value)}
                          className="flex-1 h-11 text-base min-h-[44px] bg-white"
                        />
                      </div>
                    </div>

                    {/* Referencia */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Referencia (4 dígitos)
                      </label>
                      <Input
                        type="text"
                        placeholder="1234"
                        value={paymentStepsData.paymentReference}
                        onChange={(e) => handlePaymentStepsDataChange('paymentReference', e.target.value)}
                        className="h-11 text-base min-h-[44px] bg-white"
                        maxLength={4}
                      />
                    </div>

                    {/* Banco emisor */}
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">
                        Tu banco
                      </label>
                      <Select
                        value={paymentStepsData.issuingBank}
                        onValueChange={(value) => handlePaymentStepsDataChange('issuingBank', value)}
                      >
                        <SelectTrigger className="w-full h-11 text-base min-h-[44px] bg-white">
                          <SelectValue placeholder="Emisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableBanks.map((bank) => (
                            <SelectItem key={bank.id} value={bank.name}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Paso 3: Comprobante - minimalista */}
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Comprobante</h3>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {!paymentStepsData.receipt ? (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label
                          htmlFor="receipt-upload"
                          className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Subir archivo
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-green-700 font-medium">
                            {paymentStepsData.receipt.name.length > 20 
                              ? paymentStepsData.receipt.name.substring(0, 20) + '...'
                              : paymentStepsData.receipt.name
                            }
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileUpload(null)}
                          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Botón final al final de la card */}
                <div className="pt-2">
                  <Button
                    className="w-full h-11 md:h-10 text-base md:text-sm bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
                    onClick={handleFinalSubmit}
                    disabled={!paymentStepsData.selectedBank || !paymentStepsData.documentNumber || !paymentStepsData.paymentReference || !paymentStepsData.issuingBank || !paymentStepsData.receipt}
                  >
                    Realizar pedido
                  </Button>
                </div>
              </div>
            </Card>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}