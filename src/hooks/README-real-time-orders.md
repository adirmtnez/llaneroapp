# Sistema de Pedidos en Tiempo Real

## 🚀 Características Implementadas

### ✅ **Actualizaciones Automáticas**
- **Polling cada 30 segundos** para detectar nuevos pedidos
- **Detección inteligente** de nuevos pedidos y cambios de estado
- **Pausa automática** cuando la pestaña no está visible (optimización de recursos)
- **Reanudación automática** al volver a la pestaña con refresh inmediato

### ✅ **Notificaciones en Tiempo Real**
- **Toast notifications** para nuevos pedidos
- **Contador de pedidos nuevos** con badge visual
- **Botón de notificación** destacado cuando hay nuevos pedidos
- **Scroll automático** a la parte superior al ver nuevos pedidos

### ✅ **Indicadores Visuales**
- **Indicador "En vivo"** con animación pulsante
- **Timestamp** de última actualización
- **Botón refresh manual** con spinner durante carga
- **Badge numérico** en el botón de nuevos pedidos

### ✅ **Optimizaciones de Performance**
- **Carga inicial** completa seguida de actualizaciones incrementales
- **Detección eficiente** de cambios usando comparación JSON
- **Pausa inteligente** cuando no se está visualizando la pestaña
- **Debounce** en las actualizaciones para evitar spam

## 📋 Cómo Usar

### Hook `useRealTimeOrders`

```typescript
import { useRealTimeOrders } from '@/hooks/use-real-time-orders'

const {
  orders,              // Lista actualizada de pedidos
  isLoading,           // Estado de carga inicial
  error,               // Error si existe
  lastUpdateTime,      // Timestamp de última actualización
  newOrdersCount,      // Cantidad de pedidos nuevos
  refresh,             // Función para refrescar manualmente
  markNewOrdersAsSeen  // Marcar nuevos pedidos como vistos
} = useRealTimeOrders(loadOrdersFunction, {
  refreshInterval: 30000,  // 30 segundos (opcional)
  onNewOrder: (order) => { // Callback opcional
    console.log('Nuevo pedido:', order)
  },
  enabled: true           // Habilitar/deshabilitar (opcional)
})
```

### Ejemplo Completo

```typescript
export function PedidosView() {
  const {
    orders,
    isLoading,
    error,
    newOrdersCount,
    refresh,
    markNewOrdersAsSeen
  } = useRealTimeOrders(loadAllOrders, {
    refreshInterval: 30000,
    onNewOrder: (newOrder) => {
      // Lógica personalizada para nuevos pedidos
      console.log('🆕 Nuevo pedido:', newOrder.order_number)
    }
  })

  return (
    <div>
      {/* Indicador de nuevos pedidos */}
      {newOrdersCount > 0 && (
        <Button 
          onClick={markNewOrdersAsSeen}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Bell className="h-4 w-4 mr-2" />
          {newOrdersCount} nuevos
        </Button>
      )}
      
      {/* Lista de pedidos */}
      {orders.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}
```

## 🔧 Configuración

### Opciones del Hook

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `refreshInterval` | number | 30000 | Intervalo de actualización en milisegundos |
| `onNewOrder` | function | undefined | Callback ejecutado al detectar nuevo pedido |
| `enabled` | boolean | true | Habilitar/deshabilitar el polling |

### Funciones Disponibles

| Función | Descripción |
|---------|-------------|
| `refresh()` | Refrescar pedidos manualmente |
| `markNewOrdersAsSeen()` | Resetear contador de pedidos nuevos |
| `pause()` | Pausar polling (automático al cambiar pestaña) |
| `resume()` | Reanudar polling (automático al volver a pestaña) |

## 📊 Estados y Notificaciones

### Tipos de Notificaciones

1. **Nuevos Pedidos** (Verde, 5s)
   ```
   ¡2 nuevos pedidos recibidos!
   ```

2. **Pedidos Actualizados** (Azul, 3s)
   ```
   1 pedido actualizado
   ```

### Estados Visuales

- **🟢 En vivo**: Sistema funcionando normalmente
- **🔄 Cargando**: Actualizando datos
- **⏸️ Pausado**: Pestaña no visible
- **❌ Error**: Problema de conexión

## 🚀 Implementado En

### ✅ **Bodegones - Pedidos**
- Archivo: `src/components/admin/views/bodegones/pedidos-view.tsx`
- **Características activas:**
  - ✅ Polling cada 30 segundos
  - ✅ Notificaciones toast
  - ✅ Contador de nuevos pedidos
  - ✅ Indicador "En vivo"
  - ✅ Pausa automática por visibilidad

### 🔄 **Para Implementar**
- **Restaurantes - Pedidos**: Aplicar mismo patrón cuando esté listo
- **Notificaciones Push**: Integración con service workers
- **WebSockets**: Para actualizaciones aún más inmediatas
- **Filtros en tiempo real**: Mantener filtros durante actualizaciones

## 🔍 Debugging

### Logs Disponibles
```
🔄 Cargando pedidos en tiempo real...
⏰ Auto-refresh de pedidos...
🆕 2 nuevos pedidos detectados
🔄 1 pedidos actualizados
🔇 Pestaña no visible - pausando polling
👁️ Pestaña visible - reanudando polling
```

### Eventos Monitoreados
- Carga inicial de pedidos
- Detección de nuevos pedidos
- Cambios en pedidos existentes
- Cambios de visibilidad de pestaña
- Errores de red/base de datos

## 💡 Mejoras Futuras

1. **WebSockets** para actualizaciones instantáneas
2. **Notificaciones push** del navegador
3. **Sonidos** de notificación opcionales
4. **Filtros persistentes** durante actualizaciones
5. **Métricas de tiempo real** (pedidos por hora, etc.)
6. **Sincronización multi-pestaña** para evitar duplicados