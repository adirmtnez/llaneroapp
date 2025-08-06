"use client"

import * as React from "react"
import {
  Home,
  Store,
  Building2,
  Users,
  UserCheck,
  CreditCard,
  Settings,
  MapPin,
  ShoppingBag,
  Package,
  Tags,
  Hash,
  GalleryVerticalEnd,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentView?: string
  onViewChange?: (viewId: string) => void
}

const data = {
  user: {
    name: "Admin",
    email: "admin@llanerobodegon.com",
    avatar: "/avatars/admin.jpg",
  },
  teams: [
    {
      name: "LlaneroBodegón",
      logo: GalleryVerticalEnd,
      plan: "Admin Panel",
    },
  ],
  navMain: [
    {
      title: "Inicio",
      url: "#",
      icon: Home,
      isActive: true,
      viewId: "inicio",
    },
  ],
  bodegones: [
    {
      name: "Localidades",
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
      name: "Repartidores",
      url: "#",
      icon: UserCheck,
      viewId: "bodegones-repartidores",
    },
    {
      name: "Equipo",
      url: "#",
      icon: Users,
      viewId: "bodegones-equipo",
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
      name: "Localidades",
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
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} currentView={currentView} onViewChange={onViewChange} />
        <NavProjects projects={data.bodegones} currentView={currentView} onViewChange={onViewChange} title="Bodegones" />
        <NavProjects projects={data.restaurantes} currentView={currentView} onViewChange={onViewChange} title="Restaurantes" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
