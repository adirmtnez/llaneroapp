"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Eye, EyeOff, X } from "lucide-react"

interface ModalFormTemplateProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onSubmit: (data: Record<string, unknown>) => void
}

export function ModalFormTemplate({ 
  open, 
  onOpenChange, 
  title, 
  description,
  onSubmit 
}: ModalFormTemplateProps) {
  const [isDesktop, setIsDesktop] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    // Agregar más campos según necesites
  })

  useEffect(() => {
    const checkDevice = () => {
      setIsDesktop(window.innerWidth >= 768)
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onOpenChange(false)
    // Reset form
    setFormData({ name: "", email: "", password: "" })
  }

  const handleCancel = () => {
    onOpenChange(false)
    // Reset form
    setFormData({ name: "", email: "", password: "" })
  }

  const FormContent = () => (
    <form onSubmit={handleSubmit} className={`space-y-5 ${!isDesktop ? 'pb-6' : ''}`}>
      {/* Input Text Example */}
      <div className="space-y-3">
        <Label htmlFor="name" className="text-sm font-medium">
          Nombre <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Ingresa el nombre"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="h-10 md:h-9 text-base md:text-sm"
          required
        />
      </div>

      {/* Input Email Example */}
      <div className="space-y-3">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="h-10 md:h-9 text-base md:text-sm"
        />
      </div>

      {/* Input Password with Toggle Example */}
      <div className="space-y-3">
        <Label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña segura"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            className="pr-10 h-10 md:h-9 text-base md:text-sm"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className={`flex gap-3 ${!isDesktop ? 'pt-6 sticky bottom-0 bg-white border-t -mx-4 px-4 py-4' : 'pt-4'}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleCancel} 
          className="flex-1 h-11 md:h-10 text-base md:text-sm"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          className="flex-1 h-11 md:h-10 text-base md:text-sm"
        >
          Guardar
        </Button>
      </div>
    </form>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <FormContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left border-b pb-4">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          <DrawerDescription className="text-sm text-gray-600">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <FormContent />
        </div>
      </DrawerContent>
    </Drawer>
  )
}