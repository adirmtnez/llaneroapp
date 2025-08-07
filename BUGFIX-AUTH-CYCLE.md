# Corrección: Ciclo Infinito de Eventos de Autenticación

## Problema Identificado

**Fecha:** Diciembre 2024  
**Síntoma:** Eventos repetitivos `Auth state changed: SIGNED_IN` causando múltiples recargas de datos

### Descripción del Error

El `useEffect` en `src/contexts/auth-context.tsx` tenía una dependencia `[user]` que creaba un ciclo infinito:

1. La página se vuelve visible
2. Se refresca la sesión de Supabase (`supabase.auth.getSession()`)
3. Se dispara el evento `SIGNED_IN`
4. Se carga el perfil del usuario (`loadUserProfile`)
5. El estado `user` cambia
6. El `useEffect` se ejecuta de nuevo debido a la dependencia `[user]`
7. Se crean nuevos listeners de eventos
8. **El ciclo se repite infinitamente**

### Código Problemático

```typescript
useEffect(() => {
  // ... listeners de auth y visibility
  return () => {
    subscription.unsubscribe()
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}, [user]) // ← Esta dependencia causaba el ciclo
```

## Solución Aplicada

### Cambio Realizado

**Archivo:** `src/contexts/auth-context.tsx`  
**Línea:** 81

```diff
- }, [user])
+ }, [])
```

### Explicación de la Solución

- **Eliminamos la dependencia `[user]`** del `useEffect`
- **Cambiamos a `[]`** para que el efecto solo se ejecute una vez al montar el componente
- **Preservamos toda la funcionalidad** de autenticación y manejo de visibilidad
- **Eliminamos la recreación constante** de listeners de eventos

## Impacto de la Corrección

✅ **Resuelto:** Ciclo infinito de eventos `SIGNED_IN`  
✅ **Mantenido:** Funcionalidad de autenticación  
✅ **Mantenido:** Manejo de cambios de visibilidad de página  
✅ **Mejorado:** Rendimiento (menos listeners recreados)  

## Archivos Afectados

- `src/contexts/auth-context.tsx` - Corrección principal
- `src/components/admin/views/bodegones/localidades-view.tsx` - Corrección de tipos relacionada

## Commit

```
Commit: d6e2917
Mensaje: fix: Corregir ciclo infinito de eventos 'Auth state changed: SIGNED_IN'
```

## Lecciones Aprendidas

1. **Cuidado con las dependencias de useEffect** que pueden cambiar como resultado del propio efecto
2. **Los listeners de eventos** deben configurarse una sola vez, no recrearse constantemente
3. **Los cambios de estado** pueden crear ciclos inesperados si no se manejan correctamente
4. **La depuración de eventos de autenticación** requiere entender el flujo completo de estados

## Prevención Futura

- Revisar dependencias de `useEffect` cuidadosamente
- Usar herramientas de debugging para detectar ciclos de eventos
- Documentar flujos de autenticación complejos
- Probar cambios de visibilidad de página en desarrollo