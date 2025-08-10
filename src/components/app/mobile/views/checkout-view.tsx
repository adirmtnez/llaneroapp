'use client'

import { useState } from 'react'
import { ArrowLeft, Bike, Warehouse, MapPin, ChevronDown, Check, Plus, Smartphone, Landmark, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface CheckoutViewProps {
  onBack: () => void
  selectedBodegon?: string
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

export function CheckoutView({ onBack, selectedBodegon = 'La Estrella' }: CheckoutViewProps) {
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedPayment, setSelectedPayment] = useState('pagomovil')
  const [showAddressDrawer, setShowAddressDrawer] = useState(false)
  
  // Obtener dirección seleccionada o default
  const currentAddress = selectedAddress 
    ? savedAddresses.find(addr => addr.id === selectedAddress)
    : savedAddresses.find(addr => addr.isDefault)
  
  const handleSelectAddress = (address: typeof savedAddresses[0]) => {
    setSelectedAddress(address.id)
    setShowAddressDrawer(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-10 w-10 p-0 hover:bg-gray-100 mr-3"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 pb-32">
        {/* Modo de entrega */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Modo de entrega</h2>
          
          <Card className="overflow-hidden shadow-none rounded-[20px]">
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
          
          <Card className="overflow-hidden shadow-none rounded-[20px]">
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
      </div>

      {/* Footer sticky con botón de continuar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-4 safe-area-pb">
        <Button
          size="lg"
          className="w-full h-12 rounded-full font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
          style={{ backgroundColor: '#F5E9E3', color: '#ea580c' }}
          onClick={() => {
            // TODO: Implementar lógica de checkout
            console.log('Continuar con checkout', {
              deliveryMode,
              selectedAddress,
              selectedPayment
            })
          }}
        >
          Continuar
        </Button>
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
    </div>
  )
}