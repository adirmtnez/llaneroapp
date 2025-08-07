"use client"

import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = "Cargando...", fullScreen = true }: LoadingScreenProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 bg-white z-50 flex items-center justify-center" 
    : "flex items-center justify-center p-8"

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center space-y-4">
        {/* Logo o icono */}
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
          </div>
        </div>
        
        {/* Spinner animado */}
        <div className="flex items-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-lg font-medium text-gray-700">{message}</span>
        </div>
        
        {/* Barra de progreso animada */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
        </div>
        
        {/* Texto adicional */}
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Preparando tu experiencia LlaneroBodegón
        </p>
      </div>
    </div>
  )
}

// Componente para loading inline (no full screen)
export function LoadingSpinner({ size = "default", message }: { size?: "sm" | "default" | "lg", message?: string }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6", 
    lg: "h-8 w-8"
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-orange-500`} />
      {message && <span className="text-gray-600">{message}</span>}
    </div>
  )
}