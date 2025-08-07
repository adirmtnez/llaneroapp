"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"

interface SimpleFormTemplateProps {
  title: string
  description?: string
  onSubmit: (data: any) => void
}

export function SimpleFormTemplate({ title, description, onSubmit }: SimpleFormTemplateProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
    category: "",
    isActive: true
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="w-full max-w-[1200px] space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Text */}
            <div className="grid gap-3">
              <Label htmlFor="name">
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

            {/* Input Email */}
            <div className="grid gap-3">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-10 md:h-9 text-base md:text-sm"
              />
            </div>

            {/* Input Password with Toggle */}
            <div className="grid gap-3">
              <Label htmlFor="password">Contraseña</Label>
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

            {/* Textarea */}
            <div className="grid gap-3">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Descripción opcional"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="min-h-[100px] text-base md:text-sm"
              />
            </div>

            {/* Select */}
            <div className="grid gap-3">
              <Label htmlFor="category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="h-10 md:h-9 text-base md:text-sm">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="categoria1">Categoría 1</SelectItem>
                  <SelectItem value="categoria2">Categoría 2</SelectItem>
                  <SelectItem value="categoria3">Categoría 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked as boolean)}
              />
              <Label htmlFor="isActive">Estado activo</Label>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="sm:w-auto h-11 md:h-10 text-base md:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="sm:w-auto h-11 md:h-10 text-base md:text-sm"
              >
                Guardar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}