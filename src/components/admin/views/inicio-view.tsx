export function InicioView() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard - Inicio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Pedidos Hoy</h3>
          <p className="text-3xl font-bold text-blue-600">124</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ventas del Día</h3>
          <p className="text-3xl font-bold text-green-600">$2,450</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Repartidores Activos</h3>
          <p className="text-3xl font-bold text-orange-600">8</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Productos Activos</h3>
          <p className="text-3xl font-bold text-purple-600">342</p>
        </div>
      </div>
    </div>
  )
}