'use client'

import { useState } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { InicioView } from './views/inicio-view'
import { BodegonesLocView } from './views/bodegones/localidades-view'
import { BodegonesPedView } from './views/bodegones/pedidos-view'
import { BodegonesProdView } from './views/bodegones/productos-view'
import { BodegonesCatView } from './views/bodegones/categorias-view'
import { BodegonesSubcatView } from './views/bodegones/subcategorias-view'
import { BodegonesRepartidoresView } from './views/bodegones/repartidores-view'
import { BodegonesEquipoView } from './views/bodegones/equipo-view'
import { BodegonesMetodosPagoView } from './views/bodegones/metodos-pago-view'
import { RestaurantesLocView } from './views/restaurantes/localidades-view'
import { RestaurantesPedView } from './views/restaurantes/pedidos-view'
import { RestaurantesProdView } from './views/restaurantes/productos-view'
import { RestaurantesCatView } from './views/restaurantes/categorias-view'
import { RestaurantesSubcatView } from './views/restaurantes/subcategorias-view'
import { RestaurantesRepartidoresView } from './views/restaurantes/repartidores-view'
import { RestaurantesEquipoView } from './views/restaurantes/equipo-view'
import { RestaurantesMetodosPagoView } from './views/restaurantes/metodos-pago-view'

export function AdminContent() {
  const [currentView, setCurrentView] = useState('inicio')

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <InicioView />
      case 'bodegones-localidades':
        return <BodegonesLocView />
      case 'bodegones-pedidos':
        return <BodegonesPedView />
      case 'bodegones-productos':
        return <BodegonesProdView />
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
      default:
        return <InicioView />
    }
  }

  return (
    <>
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {renderView()}
        </div>
      </SidebarInset>
    </>
  )
}