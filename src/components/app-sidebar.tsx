"use client"

import * as React from "react"
import {
  Home,
  Users,
  UserCheck,
  CreditCard,
  MapPin,
  ShoppingBag,
  Package,
  GalleryVerticalEnd,
  Store,
  UtensilsCrossed,
  TrendingUp,
} from "lucide-react"

import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView?: string
  onViewChange?: (viewId: string) => void
}

const data = {
  teams: [
    {
      name: "LlaneroBodegón",
      logo: GalleryVerticalEnd,
      plan: "Admin Panel",
    },
  ],
  bodegones: [
    {
      name: "Inicio",
      url: "#",
      icon: Home,
      viewId: "inicio",
    },
    {
      name: "Bodegones",
      url: "#",
      icon: MapPin,
      viewId: "bodegones-localidades",
    },
    {
      name: "Pedidos",
      url: "#",
      icon: ShoppingBag,
      viewId: "bodegones-pedidos",
    },
    {
      name: "Productos",
      url: "#",
      icon: Package,
      viewId: "bodegones-productos",
      items: [
        {
          title: "Todos",
          url: "#",
          viewId: "bodegones-productos-todos",
        },
        {
          title: "Categorías",
          url: "#",
          viewId: "bodegones-categorias",
        },
        {
          title: "Subcategorías",
          url: "#",
          viewId: "bodegones-subcategorias",
        },
      ],
    },
    {
      name: "Equipo",
      url: "#",
      icon: Users,
      viewId: "bodegones-equipo",
    },
    {
      name: "Repartidores",
      url: "#",
      icon: UserCheck,
      viewId: "bodegones-repartidores",
    },
    {
      name: "Métodos de Pago",
      url: "#",
      icon: CreditCard,
      viewId: "bodegones-metodos-pago",
    },
  ],
  restaurantes: [
    {
      name: "Inicio",
      url: "#",
      icon: Home,
      viewId: "inicio",
    },
    {
      name: "Restaurantes",
      url: "#",
      icon: MapPin,
      viewId: "restaurantes-localidades",
    },
    {
      name: "Pedidos",
      url: "#",
      icon: ShoppingBag,
      viewId: "restaurantes-pedidos",
    },
    {
      name: "Productos",
      url: "#",
      icon: Package,
      viewId: "restaurantes-productos",
      items: [
        {
          title: "Todos",
          url: "#",
          viewId: "restaurantes-productos",
        },
        {
          title: "Categorías",
          url: "#",
          viewId: "restaurantes-categorias",
        },
        {
          title: "Subcategorías",
          url: "#",
          viewId: "restaurantes-subcategorias",
        },
      ],
    },
    {
      name: "Repartidores",
      url: "#",
      icon: UserCheck,
      viewId: "restaurantes-repartidores",
    },
    {
      name: "Equipo",
      url: "#",
      icon: Users,
      viewId: "restaurantes-equipo",
    },
    {
      name: "Métodos de Pago",
      url: "#",
      icon: CreditCard,
      viewId: "restaurantes-metodos-pago",
    },
  ],
}

export function AppSidebar({ currentView, onViewChange, ...props }: AdminSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'bodegones' | 'restaurantes'>('bodegones')
  const { state } = useSidebar()

  // Sync tab with current view
  React.useEffect(() => {
    if (currentView) {
      if (currentView.startsWith('bodegones-')) {
        setActiveTab('bodegones')
      } else if (currentView.startsWith('restaurantes-')) {
        setActiveTab('restaurantes')
      }
    }
  }, [currentView])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* Navigation Tabs - Normal view */}
        {state !== 'collapsed' && (
          <div className="px-2 pb-1">
            <div className="flex rounded-lg bg-muted p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('bodegones')}
                className={`flex-1 h-7 text-xs font-medium ${
                  activeTab === 'bodegones' 
                    ? 'bg-white hover:bg-white shadow-sm' 
                    : 'hover:bg-muted-foreground/10'
                }`}
              >
                Bodegones
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('restaurantes')}
                className={`flex-1 h-7 text-xs font-medium ${
                  activeTab === 'restaurantes' 
                    ? 'bg-white hover:bg-white shadow-sm' 
                    : 'hover:bg-muted-foreground/10'
                }`}
              >
                Restaurantes
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Tabs - Collapsed view with vertical tab style */}
        {state === 'collapsed' && (
          <div className="px-1 pb-1">
            <div className="flex flex-col rounded-lg bg-muted p-0.5 gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('bodegones')}
                className={`h-8 w-full text-xs font-medium px-2 ${
                  activeTab === 'bodegones' 
                    ? 'bg-white hover:bg-white shadow-sm' 
                    : 'hover:bg-muted-foreground/10'
                }`}
              >
                <Store className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('restaurantes')}
                className={`h-8 w-full text-xs font-medium px-2 ${
                  activeTab === 'restaurantes' 
                    ? 'bg-white hover:bg-white shadow-sm' 
                    : 'hover:bg-muted-foreground/10'
                }`}
              >
                <UtensilsCrossed className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'bodegones' && (
          <NavProjects projects={data.bodegones} currentView={currentView} onViewChange={onViewChange} title="" />
        )}
        {activeTab === 'restaurantes' && (
          <NavProjects projects={data.restaurantes} currentView={currentView} onViewChange={onViewChange} title="" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
