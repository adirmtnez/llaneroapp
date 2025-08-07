"use client"

import {
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
  currentView,
  onViewChange,
  title = "Gestión",
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
    viewId?: string
    items?: {
      title: string
      url: string
      viewId?: string
    }[]
  }[]
  currentView?: string
  onViewChange?: (viewId: string) => void
  title?: string
}) {
  const handleItemClick = (viewId?: string) => {
    if (viewId && onViewChange) {
      onViewChange(viewId)
    }
  }

  // Check if current view is related to any parent menu item
  const isParentActive = (item: any) => {
    if (!item.items || !currentView) return false
    
    // Check if any subitems are active
    const hasActiveSubitem = item.items.some((subItem: any) => currentView === subItem.viewId)
    
    // Check for special cases like agregar/editar views
    const isProductRelated = item.viewId === 'bodegones-productos' && 
      (currentView === 'agregar-producto-bodegon' || 
       currentView === 'editar-producto-bodegon' ||
       currentView === 'bodegones-productos-todos')
    
    return hasActiveSubitem || isProductRelated
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <Collapsible
            key={item.name}
            asChild
            defaultOpen={isParentActive(item)}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              {item.items ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.name}>
                      <item.icon />
                      <span>{item.name}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            isActive={currentView === subItem.viewId}
                          >
                            <button
                              onClick={() => handleItemClick(subItem.viewId)}
                              className="w-full text-left cursor-pointer"
                            >
                              <span>{subItem.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : (
                <SidebarMenuButton 
                  isActive={currentView === item.viewId}
                  onClick={() => handleItemClick(item.viewId)}
                  tooltip={item.name}
                >
                  <item.icon />
                  <span>{item.name}</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
