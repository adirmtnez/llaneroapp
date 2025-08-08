import { Construction, Clock, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ModuleInDevelopmentProps {
  title: string
  description?: string
}

export function ModuleInDevelopment({ title, description }: ModuleInDevelopmentProps) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{title}</h1>
        {description && (
          <p className="text-gray-600 text-sm md:text-base">{description}</p>
        )}
      </div>

      {/* Main content card */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
        <CardContent className="p-8 md:p-12 text-center">
          {/* Icon animation */}
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-orange-100 rounded-full mb-4">
              <Construction className="w-10 h-10 md:w-12 md:h-12 text-orange-600" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
          </div>

          {/* Main message */}
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
            Módulo en Desarrollo
          </h2>
          
          <p className="text-gray-600 text-sm md:text-base mb-6 max-w-md mx-auto leading-relaxed">
            Estamos trabajando en esta funcionalidad para ofrecerte la mejor experiencia. 
            ¡Pronto estará disponible!
          </p>

          {/* Status indicator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-orange-100">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-sm font-medium text-orange-600">Próximamente</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom decorative elements */}
      <div className="mt-8 flex justify-center">
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-orange-200 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}