'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Home, Building, MoreHorizontal, ChevronLeft, Trash2, Edit3, Star, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { MenuDrawer } from '../menu-drawer'
import { useAuth } from '@/contexts/auth-context'
import { nuclearSelect, nuclearInsert, nuclearUpdate, nuclearDelete } from '@/utils/nuclear-client'
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

interface AddressesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const addressTypes = [
  { value: 'home', label: 'Casa', icon: Home },
  { value: 'work', label: 'Trabajo', icon: Building },
  { value: 'other', label: 'Otro', icon: MapPin }
]

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

export function AddressesDrawer({ open, onOpenChange }: AddressesDrawerProps) {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    type: 'home' as 'home' | 'work' | 'other'
  })

  // Cargar direcciones de la base de datos
  useEffect(() => {
    if (user?.auth_user?.id && open) {
      loadAddresses()
    }
  }, [user, open])

  const loadAddresses = async () => {
    if (!user?.auth_user?.id) return
    
    setIsLoading(true)
    try {
      const { data, error } = await nuclearSelect(
        'customer_addresses',
        '*',
        { customer_id: user.auth_user.id }
      )

      if (error) {
        console.error('Error loading addresses:', error)
        toast.error('Error al cargar direcciones')
        return
      }

      // Ordenar con la dirección predeterminada primero
      const sortedAddresses = (data || []).sort((a, b) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return 0
      })

      setAddresses(sortedAddresses)
    } catch (error) {
      console.error('Error loading addresses:', error)
      toast.error('Error al cargar direcciones')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = async () => {
    if (!formData.label || !formData.address_line1 || !formData.state || !formData.city || !user?.auth_user?.id) return

    setIsSaving(true)
    try {
      // Si es la primera dirección, hacerla predeterminada
      const isFirstAddress = addresses.length === 0

      const newAddressData = {
        customer_id: user.auth_user.id,
        label: formData.label,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
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
      await loadAddresses() // Recargar direcciones
      resetForm()
    } catch (error) {
      console.error('Error adding address:', error)
      toast.error('Error al agregar dirección')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditAddress = async () => {
    if (!editingAddress || !formData.label || !formData.address_line1 || !formData.state || !formData.city) return

    setIsSaving(true)
    try {
      const updateData = {
        label: formData.label,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null
      }

      const { error } = await nuclearUpdate(
        'customer_addresses',
        editingAddress.id,
        updateData
      )

      if (error) {
        console.error('Error updating address:', error)
        toast.error('Error al actualizar dirección')
        return
      }

      toast.success('Dirección actualizada exitosamente')
      await loadAddresses() // Recargar direcciones
      resetForm()
    } catch (error) {
      console.error('Error updating address:', error)
      toast.error('Error al actualizar dirección')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    const addressToDelete = addresses.find(addr => addr.id === addressId)
    if (!addressToDelete) return

    try {
      const { error } = await nuclearDelete('customer_addresses', addressId)

      if (error) {
        console.error('Error deleting address:', error)
        toast.error('Error al eliminar dirección')
        return
      }

      // Si eliminamos la dirección predeterminada y hay otras, hacer la primera predeterminada
      if (addressToDelete.is_default && addresses.length > 1) {
        const remainingAddresses = addresses.filter(addr => addr.id !== addressId)
        if (remainingAddresses.length > 0) {
          await handleSetDefault(remainingAddresses[0].id)
        }
      }

      toast.success('Dirección eliminada exitosamente')
      await loadAddresses() // Recargar direcciones
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Error al eliminar dirección')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // Primero, quitar el default de todas las direcciones
      for (const address of addresses) {
        if (address.is_default && address.id !== addressId) {
          await nuclearUpdate(
            'customer_addresses',
            address.id,
            { is_default: false }
          )
        }
      }

      // Establecer la nueva dirección como predeterminada
      const { error } = await nuclearUpdate(
        'customer_addresses',
        addressId,
        { is_default: true }
      )

      if (error) {
        console.error('Error setting default address:', error)
        toast.error('Error al establecer dirección predeterminada')
        return
      }

      toast.success('Dirección predeterminada actualizada')
      await loadAddresses() // Recargar direcciones
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error('Error al establecer dirección predeterminada')
    }
  }

  const startEditing = (address: CustomerAddress) => {
    setEditingAddress(address)
    setFormData({
      label: address.label || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      type: 'home' // Por defecto, ya que no guardamos tipo en BD
    })
    setShowAddForm(true)
  }

  const resetForm = () => {
    setFormData({
      label: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      type: 'home'
    })
    setShowAddForm(false)
    setEditingAddress(null)
  }

  const handleStateChange = (newState: string) => {
    setFormData(prev => ({
      ...prev,
      state: newState,
      city: '' // Limpiar ciudad cuando cambie el estado
    }))
  }

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

  return (
    <>
      <MenuDrawer
        open={open && !showAddForm}
        onOpenChange={onOpenChange}
        title="Mis direcciones"
      >
        <div className="flex-1 px-2 pb-6">
          {isLoading ? (
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
                onClick={() => setShowAddForm(true)}
                className="h-11 md:h-10 text-base md:text-sm font-semibold mt-4"
                style={{ backgroundColor: '#ea580c', color: 'white' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar primera dirección
              </Button>
            </div>
          ) : (
            // Lista de direcciones
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-600">
                  {addresses.length} direccion{addresses.length !== 1 ? 'es' : ''} guardada{addresses.length !== 1 ? 's' : ''}
                </span>
                <Button
                  onClick={() => setShowAddForm(true)}
                  variant="outline"
                  size="sm"
                  className="h-10 md:h-8 text-base md:text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              </div>

              <div className="space-y-3">
                {addresses.map((address) => {
                  const IconComponent = getTypeIcon(address.label || '')
                  
                  return (
                    <Card key={address.id} className="p-5 shadow-none border border-gray-200 mx-2 relative">
                      {/* Estrella de predeterminada en la esquina */}
                      {address.is_default && (
                        <div className="absolute top-3 right-3">
                          <Star className="h-4 w-4 text-orange-600 fill-orange-600" />
                        </div>
                      )}
                      
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-orange-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
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

                      {/* Menú de 3 puntos en esquina inferior derecha */}
                      <div className="absolute bottom-3 right-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!address.is_default && (
                              <DropdownMenuItem onClick={() => handleSetDefault(address.id)}>
                                <Star className="h-4 w-4 mr-2" />
                                Predeterminada
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => startEditing(address)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </MenuDrawer>

      {/* Drawer para agregar/editar dirección */}
      <Drawer open={showAddForm} onOpenChange={setShowAddForm}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="sr-only">
              {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              {editingAddress ? 'Modifica los datos de tu dirección' : 'Completa la información de tu nueva dirección'}
            </DrawerDescription>
            
            {/* Header personalizado */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h1 className="text-lg font-semibold text-gray-900">
                  {editingAddress ? 'Editar dirección' : 'Nueva dirección'}
                </h1>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={resetForm}
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
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
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
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
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
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                className="min-h-[56px] text-base bg-white"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <Select
                value={formData.state}
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
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                disabled={!formData.state}
              >
                <SelectTrigger className="min-h-[56px] text-base bg-white">
                  <SelectValue placeholder={!formData.state ? "Seleccionar estado primero" : "Seleccionar ciudad"} />
                </SelectTrigger>
                <SelectContent>
                  {getCityOptions(formData.state).map((city) => (
                    <SelectItem key={city.value} value={city.value}>
                      {city.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Botón para guardar */}
            <Button
              onClick={editingAddress ? handleEditAddress : handleAddAddress}
              disabled={isSaving || !formData.label || !formData.address_line1 || !formData.state || !formData.city}
              className="w-full min-h-[56px] text-base font-semibold"
              style={{ backgroundColor: '#ea580c', color: 'white' }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingAddress ? 'Guardando...' : 'Agregando...'}
                </>
              ) : (
                editingAddress ? 'Guardar cambios' : 'Agregar dirección'
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}