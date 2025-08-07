"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { AlertTriangleIcon } from "lucide-react"

interface DeleteConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemName: string
  itemType?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteConfirmationModal({ 
  open, 
  onOpenChange, 
  itemName, 
  itemType = "elemento", 
  onConfirm,
  isLoading = false
}: DeleteConfirmationModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const handleConfirm = () => {
    onConfirm()
    // Note: El modal se cierra desde el componente padre después de la eliminación exitosa
  }

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  const ModalContent = () => (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
          <AlertTriangleIcon className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            ¿Eliminar permanentemente {itemType}?
          </h3>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de que deseas eliminar permanentemente <span className="font-medium">&ldquo;{itemName}&rdquo;</span>? 
            Esta acción eliminará completamente el {itemType} y todos sus datos asociados. No se puede deshacer.
          </p>
        </div>
      </div>

      <div className={`flex gap-3 ${!isDesktop ? 'flex-col-reverse' : 'flex-row-reverse'}`}>
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          variant="destructive"
          className="h-11 md:h-10 text-base md:text-sm"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Eliminando...
            </>
          ) : (
            `Eliminar permanentemente`
          )}
        </Button>
        <Button
          onClick={handleCancel}
          disabled={isLoading}
          variant="outline"
          className="h-11 md:h-10 text-base md:text-sm"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              Confirma si deseas eliminar este elemento
            </DialogDescription>
          </DialogHeader>
          <ModalContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>Confirmar eliminación</DrawerTitle>
          <DrawerDescription>
            Confirma si deseas eliminar este elemento
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-6">
          <ModalContent />
        </div>
      </DrawerContent>
    </Drawer>
  )
}