-- =====================================================
-- CONFIGURACIÓN SUPABASE REALTIME PARA PEDIDOS
-- =====================================================

-- 1. Habilitar Realtime en la tabla orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 2. Configurar Row Level Security para Realtime
-- Asegurar que RLS está habilitado
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 3. Política para administradores (pueden ver todos los pedidos)
CREATE POLICY "Admins can view all orders realtime" ON orders
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email IN (
        'admin@llanerobodegon.com',
        'supervisor@llanerobodegon.com'
        -- Agregar más emails de admin según necesidad
      )
    )
  );

-- 4. Política para usuarios (solo pueden ver sus propios pedidos)
CREATE POLICY "Users can view own orders realtime" ON orders
  FOR SELECT 
  USING (customer_id = auth.uid());

-- 5. Configurar Realtime para order_items también (si es necesario)
ALTER PUBLICATION supabase_realtime ADD TABLE order_item;

-- Política RLS para order_items (si es necesario)
CREATE POLICY "Users can view own order items realtime" ON order_item
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_item.order_id 
      AND orders.customer_id = auth.uid()
    )
  );

-- 6. Configurar Realtime para order_payments (si es necesario)
ALTER PUBLICATION supabase_realtime ADD TABLE order_payments;

-- Política RLS para order_payments
CREATE POLICY "Users can view own order payments realtime" ON order_payments
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_payments.order_id 
      AND orders.customer_id = auth.uid()
    )
  );

-- =====================================================
-- CONFIGURACIÓN ADICIONAL (OPCIONAL)
-- =====================================================

-- Habilitar Realtime para otras tablas relacionadas si es necesario
-- ALTER PUBLICATION supabase_realtime ADD TABLE bodegons;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bodegon_products;
-- ALTER PUBLICATION supabase_realtime ADD TABLE customer_addresses;

-- =====================================================
-- VERIFICAR CONFIGURACIÓN
-- =====================================================

-- Verificar que las tablas están en la publicación Realtime
SELECT 
  schemaname,
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_item', 'order_payments')
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. SEGURIDAD:
   - RLS asegura que cada usuario solo vea sus propios pedidos
   - Administradores pueden ver todos los pedidos
   - Las políticas se aplican tanto a consultas normales como a Realtime

2. PERFORMANCE:
   - Realtime es más eficiente que polling
   - Los filtros RLS se aplican automáticamente
   - Usar índices en customer_id para mejor performance

3. TESTING:
   - Probar con diferentes usuarios para verificar filtros
   - Verificar que admin ve todos los pedidos
   - Verificar que usuarios normales solo ven sus pedidos

4. MONITORING:
   - Monitorear logs de Supabase para eventos Realtime
   - Verificar conexiones activas en dashboard de Supabase
   - Establecer límites de conexiones si es necesario

5. ESCALABILIDAD:
   - Supabase Realtime está limitado por el plan
   - Considerar usar filtros en el cliente para reducir eventos
   - Implementar throttling si es necesario
*/

-- =====================================================
-- COMANDOS PARA DEBUGGING
-- =====================================================

-- Ver eventos Realtime activos (en Supabase Dashboard)
-- Dashboard > Settings > API > Realtime

-- Verificar conexiones WebSocket
-- Dashboard > Logs > Realtime

-- Monitorear performance
-- Dashboard > Reports > Database