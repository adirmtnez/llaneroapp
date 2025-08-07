'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function NotFound() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 Number and Icon */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-orange-200 select-none animate-pulse mb-6">
            404
          </div>
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-full shadow-lg animate-bounce">
              <AlertTriangle className="h-12 w-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="p-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-foreground">
                ¡Página no encontrada!
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
              </p>
            </div>

            {/* Error Code */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              Error 404: Página no encontrada
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full sm:w-auto group transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
                Volver atrás
              </Button>
              
              <Link href="/" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto group transition-all duration-200">
                  <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Ir al inicio
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-sm text-muted-foreground">
          <p>LlaneroBodegón © 2024</p>
        </div>
      </div>
    </div>
  )
}