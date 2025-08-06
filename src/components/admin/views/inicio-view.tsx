import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ShoppingBagIcon, PackageIcon, UsersIcon, SettingsIcon, DownloadIcon } from "lucide-react"
import { useState } from "react"

export function InicioView() {
  const [selectedPeriod, setSelectedPeriod] = useState('Hoy')

  const periodOptions = ['Hoy', 'Esta semana', 'Este mes', 'Este año']

  return (
    <div className="space-y-6 w-full max-w-[1200px]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard - Inicio</h1>
        
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            {periodOptions.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Air Date/Time Picker
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="text-sm text-gray-600">Ventas Totales</CardDescription>
          <CardTitle className="text-4xl font-bold text-gray-900">$ 0.00</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <ShoppingBagIcon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Pedidos entregados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <PackageIcon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Productos vendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <UsersIcon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Nuevos Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <SettingsIcon className="w-6 h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-600">Cupones aplicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Productos más vendidos del mes</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                ¿Qué es lo que más compraron los clientes?
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="w-16 h-16 mb-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <PackageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700 mb-1">Aún no hay productos vendidos</p>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Cuando tengas ventas, aquí aparecerán tus productos más populares
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}