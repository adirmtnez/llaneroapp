'use client'

import { useState, useEffect } from 'react'
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
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isViewLoaded, setIsViewLoaded] = useState(false)
  const [selectedBodegon, setSelectedBodegon] = useState<BodegonPreference>({
    id: '',
    name: 'La Estrella'
  })
  const [bodegonLoaded, setBodegonLoaded] = useState(false)

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
      // Si no hay usuario, usar bodegón por defecto
      setBodegonLoaded(true)
    }
  }, [user?.auth_user?.id])

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
    }
  }

  const renderView = () => {
    const navigateToCheckout = () => setCurrentView('checkout')
    
    switch (currentView) {
      case 'inicio':
        return <InicioView 
          onNavigateToCheckout={navigateToCheckout} 
          selectedBodegon={selectedBodegon}
          onBodegonChange={handleBodegonChange}
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
          selectedBodegon={selectedBodegon.name}
        />
      default:
        return <InicioView 
          onNavigateToCheckout={navigateToCheckout}
          selectedBodegon={selectedBodegon}
          onBodegonChange={handleBodegonChange}
        />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${currentView === 'checkout' ? '' : 'pb-20'}`}>
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