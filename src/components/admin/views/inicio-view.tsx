import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ShoppingBagIcon, PackageIcon, UsersIcon, SettingsIcon, DownloadIcon } from "lucide-react"
import { useState } from "react"

export function InicioView() {
  const [selectedPeriod, setSelectedPeriod] = useState('Hoy')

  const periodOptions = ['Hoy', 'Esta semana', 'Este mes', 'Este año']

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-[1200px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">¡Hola, Carlos! 👋</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex rounded-md border w-full sm:w-auto overflow-x-auto">
            {periodOptions.map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "ghost"}
                size="sm"
                className="rounded-none first:rounded-l-md last:rounded-r-md whitespace-nowrap flex-1 sm:flex-shrink-0 h-10 md:h-8 text-base md:text-sm px-2 sm:px-3"
                onClick={() => setSelectedPeriod(period)}
              >
                {period}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Air Date/Time Picker
          </Button>
        </div>
      </div>

      <Card className="relative">
        <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
          ↗ +12.5%
        </Badge>
        <CardHeader className="pb-2 pr-16 sm:pr-20 p-4 sm:p-6">
          <CardDescription className="text-xs sm:text-sm text-muted-foreground">Total Revenue</CardDescription>
          <CardTitle className="text-2xl sm:text-4xl font-bold">$1,250.00</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="relative">
          <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
            ↗ +8.2%
          </Badge>
          <CardContent className="p-4 sm:p-6 pr-14 sm:pr-20">
            <div className="space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-100 w-fit">
                <ShoppingBagIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pedidos entregados</p>
                <p className="text-xl sm:text-2xl font-bold">142</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
            ↗ +15.3%
          </Badge>
          <CardContent className="p-4 sm:p-6 pr-14 sm:pr-20">
            <div className="space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-100 w-fit">
                <PackageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Productos vendidos</p>
                <p className="text-xl sm:text-2xl font-bold">1,847</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
            ↗ +23.1%
          </Badge>
          <CardContent className="p-4 sm:p-6 pr-14 sm:pr-20">
            <div className="space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-100 w-fit">
                <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Nuevos Clientes</p>
                <p className="text-xl sm:text-2xl font-bold">89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative">
          <Badge className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-green-100 text-green-700 hover:bg-green-100 text-xs">
            ↗ +5.7%
          </Badge>
          <CardContent className="p-4 sm:p-6 pr-14 sm:pr-20">
            <div className="space-y-3 sm:space-y-4">
              <div className="p-2 sm:p-3 rounded-lg bg-gray-100 w-fit">
                <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">Cupones aplicados</p>
                <p className="text-xl sm:text-2xl font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-4">
            <div>
              <CardTitle className="text-lg">Productos más vendidos del mes</CardTitle>
              <CardDescription className="text-sm text-gray-600">
                ¿Qué es lo que más compraron los clientes?
              </CardDescription>
            </div>
            <div className="flex justify-start">
              <Button variant="outline" size="sm" className="h-10 md:h-8 text-base md:text-sm">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
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