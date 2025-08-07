import Link from "next/link"
import Image from "next/image"
import { Store, Wrench, ArrowRightIcon } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo/Brand */}
        <div className="flex items-center justify-center mb-8">
          <Image 
            src="https://zykwuzuukrmgztpgnbth.supabase.co/storage/v1/object/public/adminapp/Llanero%20Logo.png"
            alt="LlaneroBodegón Logo"
            width={150}
            height={150}
            priority
            className="object-contain"
          />
        </div>

        {/* Under Development Message */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
            <Wrench className="w-4 h-4" />
            Aplicación en desarrollo
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Estamos construyendo algo increíble
          </h2>
          
          <p className="text-xl text-gray-600 max-w-lg mx-auto leading-relaxed">
            Nuestra plataforma de gestión de bodegones y restaurantes está en desarrollo activo. 
            Pronto podrás disfrutar de una experiencia completa.
          </p>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Link 
            href="/auth"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Acceder al Panel Admin
            <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>

        {/* Features Preview */}
        <div className="grid md:grid-cols-2 gap-6 pt-8">
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Gestión de Bodegones</h3>
            <p className="text-gray-600 text-sm">
              Administra inventarios, pedidos y productos de manera eficiente
            </p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-white/20 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Store className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Gestión de Restaurantes</h3>
            <p className="text-gray-600 text-sm">
              Control completo de menús, órdenes y operaciones del restaurante
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-sm text-gray-500">
          <p>© 2025 LlaneroBodegón. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
