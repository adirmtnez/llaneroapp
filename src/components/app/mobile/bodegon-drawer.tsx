'use client'

import { MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'

interface BodegonDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bodegones: any[]
  loadingBodegones: boolean
  selectedBodegon: string
  onBodegonSelect: (bodegon: any) => void
}

export function BodegonDrawer({
  open,
  onOpenChange,
  bodegones,
  loadingBodegones,
  selectedBodegon,
  onBodegonSelect
}: BodegonDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col max-h-[70vh]" style={{ backgroundColor: '#F9FAFC' }}>
        <DrawerHeader className="text-left pb-4">
          <DrawerTitle className="flex items-center space-x-2 text-lg font-semibold text-gray-900">
            <MapPin className="h-5 w-5 text-orange-600" />
            <span>Seleccionar Bodegón</span>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Lista de bodegones disponibles
          </DrawerDescription>
        </DrawerHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loadingBodegones ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-[20px] animate-pulse" />
              ))}
            </div>
          ) : bodegones.length > 0 ? (
            <div className="space-y-2">
              {bodegones.map((bodegon) => (
                <button
                  key={bodegon.id}
                  onClick={() => onBodegonSelect(bodegon)}
                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between rounded-[20px] border border-transparent hover:border-gray-200"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base text-gray-900 truncate">
                      {bodegon.name}
                    </div>
                    {bodegon.address && (
                      <div className="text-sm text-gray-500 truncate mt-1">
                        {bodegon.address}
                      </div>
                    )}
                  </div>
                  
                  {selectedBodegon === bodegon.name && (
                    <div className="flex items-center justify-center w-6 h-6 bg-orange-600 rounded-full flex-shrink-0 ml-4">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-gray-500 font-medium">No hay bodegones disponibles</p>
                <p className="text-gray-400 text-sm mt-1">Intenta más tarde</p>
              </div>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}