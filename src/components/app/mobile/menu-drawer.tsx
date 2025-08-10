'use client'

import { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface MenuDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  icon?: ReactNode
  children: ReactNode
}

export function MenuDrawer({
  open,
  onOpenChange,
  title,
  icon,
  children
}: MenuDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[90vh] rounded-t-[20px]" style={{ backgroundColor: '#F9FAFC' }}>
        <DrawerHeader className="text-left pb-4">
          <DrawerTitle className="sr-only">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            Configuración de {title}
          </DrawerDescription>
          
          {/* Header personalizado */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
                  {icon}
                </div>
              )}
              <h1 className="text-xl font-semibold text-gray-900">
                {title}
              </h1>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DrawerHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}