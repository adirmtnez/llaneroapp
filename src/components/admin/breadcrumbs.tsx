"use client"

import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  label: string
  viewId?: string
  onClick?: () => void
}

interface AdminBreadcrumbsProps {
  currentView: string
  onViewChange?: (viewId: string) => void
  className?: string
}

// Mapeo de vistas a breadcrumbs
const viewToBreadcrumbs: Record<string, BreadcrumbItem[]> = {
  'inicio': [
    { label: 'Inicio', viewId: 'inicio' }
  ],
  'bodegones-localidades': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Localidades', viewId: 'bodegones-localidades' }
  ],
  'bodegones-pedidos': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Pedidos', viewId: 'bodegones-pedidos' }
  ],
  'bodegones-productos': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Productos', viewId: 'bodegones-productos' }
  ],
  'bodegones-categorias': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Productos', viewId: 'bodegones-productos' },
    { label: 'Categorías', viewId: 'bodegones-categorias' }
  ],
  'bodegones-subcategorias': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Productos', viewId: 'bodegones-productos' },
    { label: 'Subcategorías', viewId: 'bodegones-subcategorias' }
  ],
  'bodegones-repartidores': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Repartidores', viewId: 'bodegones-repartidores' }
  ],
  'bodegones-equipo': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Equipo', viewId: 'bodegones-equipo' }
  ],
  'bodegones-metodos-pago': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Bodegones' },
    { label: 'Métodos de Pago', viewId: 'bodegones-metodos-pago' }
  ],
  'restaurantes-localidades': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Localidades', viewId: 'restaurantes-localidades' }
  ],
  'restaurantes-pedidos': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Pedidos', viewId: 'restaurantes-pedidos' }
  ],
  'restaurantes-productos': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Productos', viewId: 'restaurantes-productos' }
  ],
  'restaurantes-categorias': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Productos', viewId: 'restaurantes-productos' },
    { label: 'Categorías', viewId: 'restaurantes-categorias' }
  ],
  'restaurantes-subcategorias': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Productos', viewId: 'restaurantes-productos' },
    { label: 'Subcategorías', viewId: 'restaurantes-subcategorias' }
  ],
  'restaurantes-repartidores': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Repartidores', viewId: 'restaurantes-repartidores' }
  ],
  'restaurantes-equipo': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Equipo', viewId: 'restaurantes-equipo' }
  ],
  'restaurantes-metodos-pago': [
    { label: 'Inicio', viewId: 'inicio' },
    { label: 'Restaurantes' },
    { label: 'Métodos de Pago', viewId: 'restaurantes-metodos-pago' }
  ],

}

export function AdminBreadcrumbs({ currentView, onViewChange, className }: AdminBreadcrumbsProps) {
  const breadcrumbs = viewToBreadcrumbs[currentView] || [
    { label: 'Inicio', viewId: 'inicio' }
  ]

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.viewId && onViewChange) {
      onViewChange(item.viewId)
    }
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)} aria-label="Breadcrumb">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.viewId ? (
            <button
              onClick={() => handleBreadcrumbClick(item)}
              className={cn(
                "hover:text-foreground transition-colors",
                index === breadcrumbs.length - 1 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ) : (
            <span className={cn(
              index === breadcrumbs.length - 1 
                ? "text-foreground font-medium" 
                : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}