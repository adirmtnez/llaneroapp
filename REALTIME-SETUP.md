# 🔥 Supabase Realtime - Implementación Completa

## 🚀 Características Implementadas

### ✅ **Sistema de Tiempo Real Completo**
- **Supabase Realtime**: WebSockets nativos para actualizaciones instantáneas
- **Hook unificado**: `useRealtimeOrders` para admin y app del cliente
- **Seguridad RLS**: Row Level Security para filtros automáticos
- **Reconexión automática**: Manejo robusto de desconexiones
- **Estados visuales**: Indicadores de conexión en tiempo real

### ✅ **Eventos Soportados**
- **INSERT**: Nuevos pedidos → Toast + contador + callback
- **UPDATE**: Cambios de estado → Notificación sutil + callback
- **DELETE**: Pedidos eliminados → Recarga automática + callback

### ✅ **Filtros de Seguridad**
- **Admin**: Ve todos los pedidos de todos los usuarios
- **Usuario**: Solo ve sus propios pedidos (filtrado por `customer_id`)
- **RLS automático**: Políticas de seguridad aplicadas en tiempo real

## 📋 Configuración Requerida

### 1. **Configurar Supabase Dashboard**

#### a) Habilitar Realtime en las tablas:
```sql
-- Ejecutar en SQL Editor de Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_item;
ALTER PUBLICATION supabase_realtime ADD TABLE order_payments;
```

#### b) Configurar Row Level Security:
```sql
-- Ver archivo: supabase-realtime-setup.sql
-- Ejecutar todas las políticas RLS para seguridad
```

#### c) Verificar configuración:
```sql
-- Verificar tablas en Realtime
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

### 2. **Variables de Entorno**
Verificar que estas variables estén configuradas:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. **Configuración de Realtime en Supabase Dashboard**
```
1. Ir a Settings > API
2. Verificar que Realtime esté habilitado
3. Configurar límites según tu plan:
   - Free: 200 conexiones concurrentes
   - Pro: 500 conexiones concurrentes
   - Enterprise: Ilimitado
```

## 🔧 Uso del Hook

### **Admin Dashboard** (Ver todos los pedidos)
```typescript
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'

const {
  orders,                 // Lista de pedidos en tiempo real
  isLoading,             // Estado de carga inicial
  error,                 // Error si existe
  newOrdersCount,        // Contador de nuevos pedidos
  isRealtimeConnected,   // Estado de conexión WebSocket
  refresh,               // Refrescar manualmente
  reconnect,             // Reconectar WebSocket
  markNewOrdersAsSeen    // Resetear contador
} = useRealtimeOrders(loadAllOrders, {
  onNewOrder: (order) => {
    console.log('🆕 Nuevo pedido:', order)
    // Opcional: sonidos, notificaciones push, etc.
  },
  onOrderUpdate: (order) => {
    console.log('🔄 Pedido actualizado:', order)
  },
  enabled: true
  // No userId = ver todos los pedidos (admin)
})
```

### **App Cliente** (Solo pedidos del usuario)
```typescript
import { useRealtimeOrders } from '@/hooks/use-realtime-orders'

const {
  orders,
  isLoading,
  error,
  newOrdersCount,
  isRealtimeConnected,
  refresh,
  reconnect,
  markNewOrdersAsSeen
} = useRealtimeOrders(loadUserOrders, {
  onNewOrder: (order) => {
    // Notificar al usuario de su nuevo pedido
    toast.success('¡Pedido confirmado!')
  },
  onOrderUpdate: (order) => {
    // Notificar cambios de estado (ej: "en preparación")
    toast.info(`Tu pedido está ${order.status}`)
  },
  enabled: !!user?.id,
  userId: user?.id  // ✅ Filtrar solo pedidos del usuario
})
```

## 📊 Estados de Conexión

### **Estados Visuales**
```typescript
// 🟢 Conectado
isRealtimeConnected: true
// Indicador: "Tiempo Real" (verde, pulsante)

// 🟡 Desconectado/Reconectando  
isRealtimeConnected: false
// Indicador: "Reconectando..." (amarillo)
// Botón: "Reconectar" disponible
```

### **Manejo de Errores**
```typescript
// Errores automáticos manejados:
- 'CHANNEL_ERROR': Error en canal WebSocket
- 'TIMED_OUT': Timeout de conexión  
- 'CLOSED': Canal cerrado inesperadamente

// Reconexión automática en casos:
- Cambio de pestaña (pausa/reanuda)
- Pérdida de conexión temporal
- Errores de red
```

## 🔐 Seguridad (RLS)

### **Políticas Implementadas**

#### **Administradores**
```sql
-- Pueden ver todos los pedidos
CREATE POLICY "Admins can view all orders realtime" ON orders
  FOR SELECT USING (
    auth.email() IN ('admin@llanerobodegon.com', ...)
  );
```

#### **Usuarios**
```sql  
-- Solo ven sus propios pedidos
CREATE POLICY "Users can view own orders realtime" ON orders
  FOR SELECT USING (customer_id = auth.uid());
```

### **Filtrado Automático**
```typescript
// En el hook, Supabase aplica RLS automáticamente:

// Admin → Ve todos los pedidos
// Usuario → Solo sus pedidos (customer_id = auth.uid())

// No necesitas filtrar manualmente en el cliente
```

## 📈 Performance y Escalabilidad

### **Optimizaciones Implementadas**
- ✅ **Filtros RLS**: Solo eventos relevantes llegan al cliente
- ✅ **Reconexión inteligente**: Evita bucles infinitos
- ✅ **Estados de carga**: UX fluida durante conexiones
- ✅ **Throttling de eventos**: Máximo 20 eventos/segundo
- ✅ **Cleanup automático**: WebSockets se cierran correctamente

### **Límites por Plan de Supabase**
```
Free Tier:    200 conexiones concurrentes
Pro Tier:     500 conexiones concurrentes  
Enterprise:   Ilimitado

Eventos:      Incluidos en todos los planes
Bandwidth:    Según plan seleccionado
```

### **Monitoring**
```typescript
// Logs automáticos disponibles:
console.log('📡 Supabase Realtime status: SUBSCRIBED')
console.log('🆕 Nuevo pedido via Realtime:', order)
console.log('🔄 Pedido actualizado via Realtime:', order)
console.log('❌ Error en canal Supabase Realtime')
```

## 🚀 Migración Completa

### **Archivos Actualizados**
```
✅ /src/hooks/use-realtime-orders.ts          (nuevo)
✅ /src/components/admin/views/bodegones/pedidos-view.tsx  
✅ /src/components/app/mobile/views/pedidos-view.tsx
✅ /supabase-realtime-setup.sql               (configuración BD)
```

### **Archivos Obsoletos** (se pueden eliminar)
```
❌ /src/hooks/use-real-time-orders.ts         (polling)
❌ /src/hooks/use-supabase-realtime-orders.ts (versión incompleta)
❌ /src/hooks/use-hybrid-realtime-orders.ts   (versión híbrida)
```

## 🔍 Testing y Debugging

### **Probar Realtime**
```typescript
// 1. Admin Dashboard
//    - Crear pedido desde app del cliente
//    - Verificar que aparece inmediatamente en admin
//    - Toast: "¡Nuevo pedido recibido!"

// 2. App Cliente  
//    - Admin cambia estado del pedido
//    - Verificar que se actualiza en app del cliente
//    - Toast: "Pedido actualizado"

// 3. Filtros de Seguridad
//    - Usuario A no debe ver pedidos de Usuario B
//    - Admin debe ver pedidos de todos los usuarios
```

### **Debugging en Supabase Dashboard**
```
1. Dashboard > Logs > Realtime
   - Ver conexiones WebSocket activas
   - Monitorear eventos en tiempo real

2. Dashboard > Reports > Database  
   - Performance de queries RLS
   - Uso de conexiones

3. Dashboard > Settings > API > Realtime
   - Configuración y límites
   - Estado del servicio
```

## 🎯 Beneficios vs Polling

### **Antes (Polling)**
- ❌ Delay de 15-30 segundos
- ❌ Consultas innecesarias a BD
- ❌ Mayor uso de recursos
- ❌ No escala bien

### **Ahora (Realtime)**  
- ✅ **Instantáneo**: 0 delay
- ✅ **Eficiente**: Solo eventos reales
- ✅ **Escalable**: WebSockets optimizados
- ✅ **Nativo**: Integración directa con Supabase

## 🔮 Próximas Mejoras

1. **Notificaciones Push**: Integrar con service workers
2. **Sonidos**: Alertas audibles para nuevos pedidos
3. **Vibración**: Feedback háptico en móviles
4. **Filtros Avanzados**: Realtime por tipo de pedido
5. **Métricas**: Dashboard de eventos en tiempo real