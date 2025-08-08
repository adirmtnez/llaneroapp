'use client'

import { useState, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { InicioView } from './views/inicio-view'
import { BodegonesLocView } from './views/bodegones/localidades-view'
import { BodegonesPedView } from './views/bodegones/pedidos-view'
import { BodegonesProductosTodosView } from './views/bodegones/productos-todos-view'
import { BodegonesCatView } from './views/bodegones/categorias-view'
import { BodegonesSubcatView } from './views/bodegones/subcategorias-view'
import { BodegonesRepartidoresView } from './views/bodegones/repartidores-view'
import { BodegonesEquipoView } from './views/bodegones/equipo-view'
import { BodegonesMetodosPagoView } from './views/bodegones/metodos-pago-view'
import { RestaurantesLocView } from './views/restaurantes/localidades-view'
import { RestaurantesPedView } from './views/restaurantes/pedidos-view'
import { RestaurantesProdView } from './views/restaurantes/productos-view'
import { RestaurantesProductosTodosView } from './views/restaurantes/productos-todos-view'
import { RestaurantesCatView } from './views/restaurantes/categorias-view'
import { RestaurantesSubcatView } from './views/restaurantes/subcategorias-view'
import { RestaurantesRepartidoresView } from './views/restaurantes/repartidores-view'
import { RestaurantesEquipoView } from './views/restaurantes/equipo-view'
import { RestaurantesMetodosPagoView } from './views/restaurantes/metodos-pago-view'
import { RepartidoresView } from './views/repartidores-view'
import { EquipoView } from './views/equipo-view'
import { MetodosPagoView } from './views/metodos-pago-view'
import { ConfiguracionesView } from './views/configuraciones-view'
import { AdminBreadcrumbs } from './breadcrumbs'


export function AdminContent() {
  const [currentView, setCurrentView] = useState<string | null>(null)
  const [isViewLoaded, setIsViewLoaded] = useState(false)

  // Save and restore current view from localStorage
  useEffect(() => {
    // Restore saved view on component mount
    const savedView = localStorage.getItem('adminCurrentView')
    setCurrentView(savedView || 'inicio')
    setIsViewLoaded(true)
  }, [])

  // Save current view to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (isViewLoaded && currentView) {
      localStorage.setItem('adminCurrentView', currentView)
    }
  }, [currentView, isViewLoaded])

  // Don't render until view is loaded from localStorage
  if (!isViewLoaded || !currentView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Cargando vista...</div>
      </div>
    )
  }

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <InicioView />
      case 'bodegones-localidades':
        return <BodegonesLocView />
      case 'bodegones-pedidos':
        return <BodegonesPedView />
      case 'bodegones-productos':
        return <BodegonesProductosTodosView />
      case 'bodegones-productos-todos':
        return <BodegonesProductosTodosView />
      case 'bodegones-categorias':
        return <BodegonesCatView />
      case 'bodegones-subcategorias':
        return <BodegonesSubcatView />
      case 'bodegones-repartidores':
        return <BodegonesRepartidoresView />
      case 'bodegones-equipo':
        return <BodegonesEquipoView />
      case 'bodegones-metodos-pago':
        return <BodegonesMetodosPagoView />
      case 'restaurantes-localidades':
        return <RestaurantesLocView />
      case 'restaurantes-pedidos':
        return <RestaurantesPedView />
      case 'restaurantes-productos':
        return <RestaurantesProdView />
      case 'restaurantes-productos-todos':
        return <RestaurantesProductosTodosView />
      case 'restaurantes-categorias':
        return <RestaurantesCatView />
      case 'restaurantes-subcategorias':
        return <RestaurantesSubcatView />
      case 'restaurantes-repartidores':
        return <RestaurantesRepartidoresView />
      case 'restaurantes-equipo':
        return <RestaurantesEquipoView />
      case 'restaurantes-metodos-pago':
        return <RestaurantesMetodosPagoView />
      case 'repartidores':
        return <RepartidoresView />
      case 'equipo':
        return <EquipoView />
      case 'metodos-pago':
        return <MetodosPagoView />
      case 'configuraciones':
        return <ConfiguracionesView />
      default:
        return <InicioView />
    }
  }

  return (
    <>
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-4 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <AdminBreadcrumbs currentView={currentView} onViewChange={setCurrentView} />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 pt-6 sm:pt-4 pb-8 sm:pb-4 items-center">
          {renderView()}
        </div>
      </SidebarInset>

    </>
  )
}