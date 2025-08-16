'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, Bike, Warehouse, MapPin, ChevronDown, Check, Plus, Smartphone, Landmark, Globe, Upload, FileText, CreditCard, X, Loader2, CheckCircle, Home, Building, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useAuth } from '@/contexts/auth-context'
import { nuclearSelect, nuclearUpdate, nuclearInsert } from '@/utils/nuclear-client'
import { toast } from 'sonner'

interface CustomerAddress {
  id: string
  customer_id: string
  address_line1: string
  address_line2?: string | null
  city?: string | null
  state?: string | null
  is_default?: boolean | null
  label?: string | null
}

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

// Helper functions for addresses
const getTypeIcon = (label: string) => {
  const lowerLabel = label?.toLowerCase() || ''
  if (lowerLabel.includes('casa') || lowerLabel.includes('home')) return Home
  if (lowerLabel.includes('trabajo') || lowerLabel.includes('work') || lowerLabel.includes('oficina')) return Building
  return MapPin
}

const getAddressDisplay = (address: CustomerAddress) => {
  let display = address.address_line1
  if (address.address_line2) {
    display += `, ${address.address_line2}`
  }
  return display
}

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
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [showAddAddressForm, setShowAddAddressForm] = useState(false)
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressFormData, setAddressFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: ''
  })

  // Opciones de estado y ciudades
  const stateOptions = [
    { value: 'Lara', label: 'Lara' },
    { value: 'Yaracuy', label: 'Yaracuy' }
  ]

  const getCityOptions = (state: string) => {
    if (state === 'Lara') {
      return [
        { value: 'Barquisimeto', label: 'Barquisimeto' },
        { value: 'Cabudare', label: 'Cabudare' }
      ]
    } else if (state === 'Yaracuy') {
      return [
        { value: 'Yaritagua', label: 'Yaritagua' }
      ]
    }
    return []
  }
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
  const [verificationCode, setVerificationCode] = useState('')
  
  // Animación de entrada
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsViewLoaded(true)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  // Cargar direcciones del usuario
  const loadAddresses = async () => {
    if (!user?.auth_user?.id) return
    
    setLoadingAddresses(true)
    try {
      const { data, error } = await nuclearSelect(
        'customer_addresses',
        '*',
        { customer_id: user.auth_user.id }
      )

      if (error) {
        console.error('Error loading addresses:', error)
        return
      }

      // Ordenar con la dirección predeterminada primero
      const sortedAddresses = (data || []).sort((a, b) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return 0
      })

      setAddresses(sortedAddresses)

      // Si no hay dirección seleccionada, seleccionar la predeterminada
      if (!selectedAddress && sortedAddresses.length > 0) {
        const defaultAddress = sortedAddresses.find(addr => addr.is_default)
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id)
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error)
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Cargar direcciones cuando se abra el drawer o cuando cambie el usuario
  useEffect(() => {
    if (user?.auth_user?.id && deliveryMode === 'delivery') {
      loadAddresses()
    }
  }, [user, deliveryMode])
  
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
           bodegon_products(id, name, price, image_gallery_urls)`,
          { 
            created_by: user.auth_user.id,
            order_id: null // Solo items que no están en un pedido confirmado
          }
        )

        if (error) {
          console.error('❌ Error cargando carrito:', error)
          setCartItems([])
          return
        }

        // Transformar a formato CartItem
        const transformedItems: CartItem[] = (data || []).map((item: any) => ({
          id: item.bodegon_products?.id || item.bodegon_product_id || item.id,
          name: item.bodegon_products?.name || item.name_snapshot || 'Producto sin nombre',
          price: item.bodegon_products?.price || item.unit_price || 0,
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
  // useEffect(() => {
  //   // Simular que se aplicó un cupón (puedes modificar esto)
  //   // Por ejemplo, si hay productos en el carrito, aplicar el primer cupón
  //   if (cartItems.length > 0 && !appliedCoupon && !loadingCart) {
  //     // Simular aplicar cupón de bienvenida
  //     setAppliedCoupon(availableCoupons[2]) // WELCOME15
  //     console.log('🎫 Cupón aplicado automáticamente:', availableCoupons[2])
  //   }
  // }, [cartItems.length, appliedCoupon, loadingCart])
  
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
  const shippingCost = 0 // Envío gratis para todos los pedidos
  
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
    ? addresses.find(addr => addr.id === selectedAddress)
    : addresses.find(addr => addr.is_default)
  
  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddress(address.id)
    setShowAddressDrawer(false)
  }

  // Abrir drawer de direcciones (cargar direcciones si no están cargadas)
  const handleOpenAddressDrawer = () => {
    setShowAddressDrawer(true)
    if (addresses.length === 0) {
      loadAddresses()
    }
  }

  // Manejar agregar nueva dirección
  const handleAddAddress = async () => {
    if (!addressFormData.label || !addressFormData.address_line1 || !addressFormData.state || !addressFormData.city || !user?.auth_user?.id) return

    setIsSavingAddress(true)
    try {
      // Si es la primera dirección, hacerla predeterminada
      const isFirstAddress = addresses.length === 0

      const newAddressData = {
        customer_id: user.auth_user.id,
        label: addressFormData.label,
        address_line1: addressFormData.address_line1,
        address_line2: addressFormData.address_line2 || null,
        city: addressFormData.city || null,
        state: addressFormData.state || null,
        is_default: isFirstAddress
      }

      const { data, error } = await nuclearInsert(
        'customer_addresses',
        newAddressData,
        '*'
      )

      if (error) {
        console.error('Error adding address:', error)
        toast.error('Error al agregar dirección')
        return
      }

      toast.success('Dirección agregada exitosamente')
      
      // Recargar direcciones y seleccionar la nueva si es la primera
      await loadAddresses()
      if (isFirstAddress && data) {
        setSelectedAddress(data[0].id)
      }
      
      resetAddressForm()
    } catch (error) {
      console.error('Error adding address:', error)
      toast.error('Error al agregar dirección')
    } finally {
      setIsSavingAddress(false)
    }
  }

  const resetAddressForm = () => {
    setAddressFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: ''
    })
    setShowAddAddressForm(false)
  }

  const handleOpenAddAddressForm = () => {
    setShowAddAddressForm(true)
  }

  const handleStateChange = (newState: string) => {
    setAddressFormData(prev => ({
      ...prev,
      state: newState,
      city: '' // Limpiar ciudad cuando cambie el estado
    }))
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
    if (!user?.auth_user?.id) {
      toast.error('Error: Usuario no autenticado')
      return
    }

    // Validar dirección para delivery
    if (deliveryMode === 'delivery' && !selectedAddress) {
      toast.error('Debe seleccionar una dirección de entrega')
      return
    }

    setIsCreatingOrder(true)
    
    try {
      console.log('🚀 Iniciando creación de pedido real')

      // Importar función de creación de pedidos
      const { createCompleteOrder } = await import('@/utils/order-utils')

      // Preparar datos del pedido
      const orderData = {
        customerId: user.auth_user.id,
        bodegonId: user.profile?.preferred_bodegon || null, // Usar bodegón preferido del usuario
        deliveryMode,
        deliveryAddressId: deliveryMode === 'delivery' ? selectedAddress : null,
        subtotal,
        shippingCost,
        discountAmount: couponDiscount,
        totalAmount: total,
        couponCode: appliedCoupon?.code,
        customerPhone: `${contactData.phonePrefix}${contactData.phoneNumber}`,
        notes: '',
        paymentData: {
          paymentMethod: selectedPayment,
          bankDestination: paymentStepsData.selectedBank,
          bankOrigin: paymentStepsData.issuingBank,
          documentType: paymentStepsData.documentType,
          documentNumber: paymentStepsData.documentNumber,
          paymentReference: paymentStepsData.paymentReference,
          receiptUrl: paymentStepsData.receipt?.name || undefined
        }
      }

      console.log('📋 Datos del pedido preparados:', orderData)

      // Crear el pedido completo
      const result = await createCompleteOrder(orderData)

      if (!result.success) {
        throw new Error(result.error || 'Error al crear el pedido')
      }

      console.log('✅ Pedido creado exitosamente:', result)

      // Actualizar estados con los datos reales del pedido
      setOrderNumber(result.orderNumber || '')
      setVerificationCode(result.verificationCode || '')
      
      setIsCreatingOrder(false)
      setShowPaymentSteps(false)
      setOrderCreated(true)

      toast.success('¡Pedido creado exitosamente!')

    } catch (error) {
      console.error('❌ Error creando pedido:', error)
      toast.error(error instanceof Error ? error.message : 'Error al procesar el pedido')
      setIsCreatingOrder(false)
    }
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

            {/* Código de verificación para entrega */}
            <div className="bg-orange-50 rounded-2xl p-4 mb-4 border-2 border-orange-200">
              <div className="text-center">
                <p className="text-xs text-orange-700 font-medium mb-1">🔑 Código de entrega</p>
                <p className="text-3xl font-bold text-orange-800 mb-2 tracking-widest">{verificationCode}</p>
                <p className="text-xs text-orange-600 leading-relaxed">
                  Proporciona este código al repartidor para confirmar tu entrega
                </p>
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
            className="w-full max-w-sm min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-8">
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
                onClick={handleOpenAddAddressForm}
                className="text-orange-600 hover:text-orange-700 p-0"
              >
                Agregar dirección
              </Button>
            </div>
            
            <Card className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleOpenAddressDrawer}>
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0">
                    {currentAddress ? (
                      <>
                        <span className="font-medium text-gray-900 truncate">{currentAddress.label || 'Sin nombre'}</span>
                        <span className="text-sm text-gray-500 truncate">{getAddressDisplay(currentAddress)}{currentAddress.city ? `, ${currentAddress.city}` : ''}</span>
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
              className="w-full min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
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
          <DrawerHeader className="pb-4">
            <DrawerTitle className="sr-only">Seleccionar dirección</DrawerTitle>
            <DrawerDescription className="sr-only">
              Lista de direcciones guardadas del usuario
            </DrawerDescription>
            
            {/* Header personalizado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddressDrawer(false)}
                  className="h-10 md:h-8 p-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Seleccionar dirección
                </h1>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenAddAddressForm}
                className="h-10 md:h-8 p-2"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto pb-8">
            <div className="px-2">
              {loadingAddresses ? (
                // Loading State
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                  <p className="text-gray-600 text-sm">Cargando direcciones...</p>
                </div>
              ) : addresses.length === 0 ? (
                // Empty State
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-orange-600" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sin direcciones guardadas
                    </h3>
                    <p className="text-gray-600 text-sm max-w-xs">
                      Agrega direcciones de entrega para hacer tus pedidos más rápido
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleOpenAddAddressForm}
                    className="h-11 md:h-10 text-base md:text-sm font-semibold mt-4"
                    style={{ backgroundColor: '#ea580c', color: 'white' }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar primera dirección
                  </Button>
                </div>
              ) : (
                // Lista de direcciones
                <div className="space-y-3 pb-6">
                  {addresses.map((address) => {
                    const IconComponent = getTypeIcon(address.label || '')
                    const isSelected = selectedAddress === address.id || (!selectedAddress && address.is_default)
                    
                    return (
                      <Card 
                        key={address.id} 
                        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors shadow-none border border-gray-200 mx-2 relative"
                        onClick={() => handleSelectAddress(address)}
                      >
                        {/* Estrella de predeterminada en la esquina */}
                        {address.is_default && (
                          <div className="absolute top-3 right-3">
                            <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
                          </div>
                        )}
                        
                        {/* Check de selección en esquina inferior derecha */}
                        {isSelected && (
                          <div className="absolute bottom-3 right-3">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <IconComponent className="h-5 w-5 text-orange-600" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-8">
                            <div className="mb-1">
                              <h4 className="font-semibold text-gray-900 text-base">{address.label || 'Sin nombre'}</h4>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-1 leading-relaxed">
                              {getAddressDisplay(address)}
                            </p>
                            <div className="space-y-0">
                              {address.city && (
                                <p className="text-xs text-gray-500">{address.city}</p>
                              )}
                              {address.state && (
                                <p className="text-xs text-gray-500">{address.state}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                  
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add Address Form Drawer */}
      <Drawer open={showAddAddressForm} onOpenChange={setShowAddAddressForm}>
        <DrawerContent className="max-h-[85vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
          <DrawerHeader className="pb-2">
            <DrawerTitle className="sr-only">Nueva dirección</DrawerTitle>
            <DrawerDescription className="sr-only">
              Completa la información de tu nueva dirección
            </DrawerDescription>
            
            {/* Header personalizado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold text-gray-900">
                  Nueva dirección
                </h1>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={resetAddressForm}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-8 space-y-3">
            {/* Nombre de la dirección */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Nombre de la dirección
              </label>
              <Input
                placeholder="Ej: Casa, Trabajo, Casa de mamá"
                value={addressFormData.label}
                onChange={(e) => setAddressFormData({ ...addressFormData, label: e.target.value })}
                className="min-h-[56px] text-base bg-white"
              />
            </div>

            {/* Dirección principal */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Dirección principal
              </label>
              <Input
                placeholder="Av. Principal #123, Urbanización Los Jardines"
                value={addressFormData.address_line1}
                onChange={(e) => setAddressFormData({ ...addressFormData, address_line1: e.target.value })}
                className="min-h-[56px] text-base bg-white"
              />
            </div>

            {/* Complemento de dirección */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Complemento <span className="text-gray-400">(opcional)</span>
              </label>
              <Input
                placeholder="Apartamento, piso, referencia..."
                value={addressFormData.address_line2}
                onChange={(e) => setAddressFormData({ ...addressFormData, address_line2: e.target.value })}
                className="min-h-[56px] text-base bg-white"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <Select
                value={addressFormData.state}
                onValueChange={handleStateChange}
              >
                <SelectTrigger className="min-h-[56px] text-base bg-white">
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Ciudad
              </label>
              <Select
                value={addressFormData.city}
                onValueChange={(value) => setAddressFormData({ ...addressFormData, city: value })}
                disabled={!addressFormData.state}
              >
                <SelectTrigger className="min-h-[56px] text-base bg-white">
                  <SelectValue placeholder={!addressFormData.state ? "Seleccionar estado primero" : "Seleccionar ciudad"} />
                </SelectTrigger>
                <SelectContent>
                  {getCityOptions(addressFormData.state).map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón para guardar */}
            <Button
              onClick={handleAddAddress}
              disabled={isSavingAddress || !addressFormData.label || !addressFormData.address_line1 || !addressFormData.state || !addressFormData.city}
              className="w-full min-h-[56px] text-base font-semibold"
              style={{ backgroundColor: '#ea580c', color: 'white' }}
            >
              {isSavingAddress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agregando...
                </>
              ) : (
                'Agregar dirección'
              )}
            </Button>
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
                    <SelectTrigger className="w-24 min-h-[56px] text-base bg-white">
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
                    className="flex-1 min-h-[56px] text-base bg-white"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[56px] text-base rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowContactDrawer(false)}
                >
                  Atrás
                </Button>
                
                <Button
                  className="flex-1 min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
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
                    <SelectTrigger className="w-full min-h-[56px] text-base bg-white">
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
                          <SelectTrigger className="w-16 min-h-[56px] text-base bg-white">
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
                          className="flex-1 min-h-[56px] text-base bg-white"
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
                        className="min-h-[56px] text-base bg-white"
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
                        <SelectTrigger className="w-full min-h-[56px] text-base bg-white">
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
                    className="w-full min-h-[56px] text-base bg-orange-600 hover:bg-orange-700 text-white rounded-full font-semibold transition-colors"
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