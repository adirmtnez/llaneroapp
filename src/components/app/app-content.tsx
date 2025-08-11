'use client'

import { useState, useEffect, useRef } from 'react'
import { BottomNavigation } from './mobile/bottom-navigation'
import { InicioView } from './mobile/views/inicio-view'
import { BuscarView } from './mobile/views/buscar-view'
import { PedidosView } from './mobile/views/pedidos-view'
import { CuentaView } from './mobile/views/cuenta-view'
import { CheckoutView } from './mobile/views/checkout-view'
import { useAuth } from '@/contexts/auth-context'
import { loadBodegonPreference, saveBodegonPreference, type BodegonPreference } from '@/utils/bodegon-preferences'

export default function AppContent() {
  const { user } = useAuth()
  const mainRef = useRef<HTMLElement>(null)
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isViewLoaded, setIsViewLoaded] = useState(false)
  const [selectedBodegon, setSelectedBodegon] = useState<BodegonPreference>({
    id: '',
    name: 'La Estrella'
  })
  const [bodegonLoaded, setBodegonLoaded] = useState(false)
  const [cartItems, setCartItems] = useState<any[]>([])
  
  // Debug: Log cart items changes
  useEffect(() => {
    console.log('📦 AppContent cartItems updated:', cartItems)
  }, [cartItems])
  
  // Callback function with logging
  const handleCartItemsChange = (newCartItems: any[]) => {
    console.log('🔄 AppContent receiving cart update:', newCartItems)
    setCartItems(newCartItems)
  }

  // Save and restore current view from localStorage
  useEffect(() => {
    // Restore saved view on component mount
    const savedView = localStorage.getItem('appCurrentView')
    setCurrentView(savedView || 'inicio')
    setIsViewLoaded(true)
  }, [])

  // Save current view to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isViewLoaded && currentView) {
      localStorage.setItem('appCurrentView', currentView)
    }
  }, [currentView, isViewLoaded])

  // Load user's bodegon preference when user is available
  useEffect(() => {
    if (user?.auth_user?.id) {
      loadBodegonPreference(user.auth_user.id).then(preference => {
        console.log('🏪 Preferencia de bodegón cargada:', preference)
        setSelectedBodegon(preference)
        setBodegonLoaded(true)
      })
    } else {
      // Si no hay usuario (invitado), usar bodegón por defecto
      console.log('👤 Usuario invitado - usando bodegón por defecto')
      setBodegonLoaded(true)
    }
  }, [user?.auth_user?.id])

  // Efecto para resetear scroll cuando cambia la vista
  useEffect(() => {
    if (mainRef.current && currentView) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentView])

  // Don't render until view and bodegon are loaded
  if (!isViewLoaded || !currentView || !bodegonLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando...</div>
      </div>
    )
  }

  // Handle bodegon preference change
  const handleBodegonChange = async (bodegon: BodegonPreference) => {
    console.log('🏪 Cambiando bodegón:', bodegon)
    setSelectedBodegon(bodegon)
    
    // Save preference to database if user is logged in
    if (user?.auth_user?.id && bodegon.id) {
      try {
        await saveBodegonPreference(user.auth_user.id, bodegon.id)
      } catch (error) {
        console.error('Error guardando preferencia de bodegón:', error)
      }
    } else if (!user?.auth_user?.id) {
      console.log('👤 Usuario invitado - preferencia no persistida')
    }
  }

  const renderView = () => {
    const navigateToCheckout = () => {
      // Solo permitir checkout si está autenticado
      if (user?.auth_user?.id) {
        setCurrentView('checkout')
      } else {
        console.log('👤 Usuario invitado - checkout requiere autenticación')
        // El componente que llame esto debería manejar la auth antes de llamar
      }
    }
    
    const navigateToAccount = () => {
      setCurrentView('cuenta')
    }
    
    switch (currentView) {
      case 'inicio':
        return <InicioView 
          onNavigateToCheckout={navigateToCheckout} 
          selectedBodegon={selectedBodegon}
          onBodegonChange={handleBodegonChange}
          onNavigateToAccount={navigateToAccount}
        />
      case 'buscar':
        return <BuscarView />
      case 'pedidos':
        return <PedidosView />
      case 'cuenta':
        return <CuentaView />
      case 'checkout':
        return <CheckoutView 
          onBack={() => setCurrentView('inicio')} 
          onNavigateHome={() => setCurrentView('inicio')}
          selectedBodegon={selectedBodegon.name}
          currency="$"
        />
      default:
        return <InicioView 
          onNavigateToCheckout={navigateToCheckout}
          selectedBodegon={selectedBodegon}
          onBodegonChange={handleBodegonChange}
          onNavigateToAccount={navigateToAccount}
          onCartItemsChange={handleCartItemsChange}
        />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <main ref={mainRef} className={`flex-1 overflow-y-auto ${currentView === 'checkout' ? '' : 'pb-20'}`}>
        {renderView()}
      </main>

      {/* Bottom Navigation - Ocultar en checkout */}
      {currentView !== 'checkout' && (
        <BottomNavigation 
          currentView={currentView} 
          onViewChange={setCurrentView} 
        />
      )}
    </div>
  )
}