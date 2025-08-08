"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  requireNameConfirmation?: boolean
}

interface ModalContentProps {
  itemName: string
  itemType: string
  confirmationText: string
  setConfirmationText: (value: string) => void
  requireNameConfirmation: boolean
  isLoading: boolean
  onConfirm: () => void
  onCancel: () => void
  isDesktop: boolean
}

const ModalContentComponent = ({ 
  itemName, 
  itemType, 
  confirmationText, 
  setConfirmationText,
  requireNameConfirmation,
  isLoading,
  onConfirm,
  onCancel,
  isDesktop
}: ModalContentProps) => {
  const isConfirmDisabled = isLoading || (requireNameConfirmation && confirmationText.trim() !== itemName.trim())

  return (
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

      {requireNameConfirmation && (
        <div className="space-y-2">
          <Label htmlFor="confirmName" className="text-sm font-medium text-gray-900">
            Para confirmar, escribe <span className="font-semibold text-red-600">{itemName}</span>
          </Label>
          <Input
            id="confirmName"
            type="text"
            placeholder={`Escribe "${itemName}" para confirmar`}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="h-10 md:h-9 text-base md:text-sm"
            disabled={isLoading}
            autoComplete="off"
          />
          {confirmationText.trim() !== "" && confirmationText.trim() !== itemName.trim() && (
            <p className="text-xs text-red-600">
              El nombre no coincide. Debes escribir exactamente: {itemName}
            </p>
          )}
        </div>
      )}

      <div className={`flex gap-3 ${!isDesktop ? 'flex-col-reverse' : 'flex-row-reverse'}`}>
        <Button
          onClick={onConfirm}
          disabled={isConfirmDisabled}
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
          onClick={onCancel}
          disabled={isLoading}
          variant="outline"
          className="h-11 md:h-10 text-base md:text-sm"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export function DeleteConfirmationModal({ 
  open, 
  onOpenChange, 
  itemName, 
  itemType = "elemento", 
  onConfirm,
  isLoading = false,
  requireNameConfirmation = false
}: DeleteConfirmationModalProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [confirmationText, setConfirmationText] = useState("")

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmationText("")
    }
  }, [open])

  const handleConfirm = useCallback(() => {
    // If name confirmation is required, check if the text matches
    if (requireNameConfirmation && confirmationText.trim() !== itemName.trim()) {
      return // Don't proceed if names don't match
    }
    
    onConfirm()
    // Note: El modal se cierra desde el componente padre después de la eliminación exitosa
  }, [requireNameConfirmation, confirmationText, itemName, onConfirm])

  const handleCancel = useCallback(() => {
    if (!isLoading) {
      onOpenChange(false)
    }
  }, [isLoading, onOpenChange])

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
          <ModalContentComponent
            itemName={itemName}
            itemType={itemType}
            confirmationText={confirmationText}
            setConfirmationText={setConfirmationText}
            requireNameConfirmation={requireNameConfirmation}
            isLoading={isLoading}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isDesktop={isDesktop}
          />
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
          <ModalContentComponent
            itemName={itemName}
            itemType={itemType}
            confirmationText={confirmationText}
            setConfirmationText={setConfirmationText}
            requireNameConfirmation={requireNameConfirmation}
            isLoading={isLoading}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isDesktop={isDesktop}
          />
        </div>
      </DrawerContent>
    </Drawer>
  )
}