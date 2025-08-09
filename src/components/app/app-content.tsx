'use client'

import { useState, useEffect } from 'react'
import { BottomNavigation } from './mobile/bottom-navigation'
import { InicioView } from './mobile/views/inicio-view'
import { BuscarView } from './mobile/views/buscar-view'
import { PedidosView } from './mobile/views/pedidos-view'
import { CuentaView } from './mobile/views/cuenta-view'

export default function AppContent() {
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isViewLoaded, setIsViewLoaded] = useState(false)

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

  // Don't render until view is loaded from localStorage
  if (!isViewLoaded || !currentView) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Cargando vista...</div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <InicioView />
      case 'buscar':
        return <BuscarView />
      case 'pedidos':
        return <PedidosView />
      case 'cuenta':
        return <CuentaView />
      default:
        return <InicioView />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Llanero Bodegón
          </h1>
          <div className="text-sm text-gray-500">
            ¡Hola! 👋
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderView()}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />
    </div>
  )
}