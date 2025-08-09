# Proyecto llanerobodegon - Instrucciones de Desarrollo

## Tecnologías y Herramientas

- **Framework**: Next.js con TypeScript
- **Styling**: Tailwind CSS
- **Componentes UI**: Shadcn UI (sidebar-07) para el desarrollo del dashboard
- **Iconos**: Lucide React como paquetería de iconos
- **Linting**: ESLint

## Estructura del Proyecto

- Utilizamos App Router de Next.js
- Código fuente en directorio `src/`
- Configuración con Turbopack para desarrollo rápido

### Arquitectura de Rutas

El proyecto tiene dos aplicaciones principales independientes:

1. **`/admin`** - Dashboard administrativo (SPA)
2. **`/app`** - Aplicación para clientes (SPA)

Cada ruta funciona como una Single Page Application (SPA) independiente con su propio sistema de navegación.

## Sistema de Navegación SPA - Admin Dashboard

### Estructura del Sidebar

El dashboard admin utiliza Shadcn UI sidebar-07 con la siguiente estructura jerárquica:

#### **🔹 General**
- `inicio` - Dashboard principal con métricas

#### **🏪 Bodegones**
- `bodegones-localidades` - Gestión de localidades
- `bodegones-pedidos` - Gestión de pedidos
- `bodegones-productos` - Gestión de productos (expandible)
  - `bodegones-categorias` - Categorías de productos
  - `bodegones-subcategorias` - Subcategorías de productos
- `bodegones-repartidores` - Gestión de repartidores
- `bodegones-equipo` - Gestión del equipo
- `bodegones-metodos-pago` - Métodos de pago

#### **🏢 Restaurantes**
- `restaurantes-localidades` - Gestión de localidades
- `restaurantes-pedidos` - Gestión de pedidos
- `restaurantes-productos` - Gestión de productos (expandible)
  - `restaurantes-categorias` - Categorías de productos
  - `restaurantes-subcategorias` - Subcategorías de productos
- `restaurantes-repartidores` - Gestión de repartidores
- `restaurantes-equipo` - Gestión del equipo
- `restaurantes-metodos-pago` - Métodos de pago

### Implementación Técnica

- **Navegación**: Sistema basado en estado (`useState`) para cambiar vistas
- **Componentes**: Cada vista tiene su componente específico en `src/components/admin/views/`
- **Sidebar**: Componente `AppSidebar` con navegación colapsible
- **Layout**: `SidebarProvider` de Shadcn UI para manejo del estado del sidebar

### Archivos Clave

- `src/app/admin/layout.tsx` - Layout principal con SidebarProvider
- `src/app/admin/page.tsx` - Página principal del admin
- `src/components/admin/admin-content.tsx` - Router principal del SPA
- `src/components/app-sidebar.tsx` - Sidebar con navegación
- `src/components/nav-main.tsx` - Navegación principal
- `src/components/nav-projects.tsx` - Navegación de proyectos con subitems
- `src/components/admin/views/` - Componentes de vistas específicas

### Convenciones de Desarrollo

1. **Nombres de vistas**: Usar formato `[seccion]-[subseccion]` (ej: `bodegones-localidades`)
2. **Componentes de vista**: Crear en directorio correspondiente bajo `views/`
3. **Importaciones**: Importar nuevas vistas en `admin-content.tsx`
4. **Navegación**: Agregar casos en el switch del método `renderView()`

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Git Flow - Metodología de Ramas

### Configuración

El proyecto utiliza **Git Flow** como metodología de control de versiones con la siguiente configuración:

#### Ramas Principales
- **`main`** - Rama de producción (releases estables)
- **`develop`** - Rama de desarrollo (integración de features)

#### Ramas de Soporte
- **`feature/*`** - Nuevas funcionalidades
- **`bugfix/*`** - Corrección de bugs en develop
- **`release/*`** - Preparación de releases
- **`hotfix/*`** - Corrección urgente en producción
- **`support/*`** - Ramas de soporte

### Flujo de Trabajo

#### Desarrollo de Features
```bash
# Crear nueva feature
git flow feature start nombre-feature

# Finalizar feature (merge a develop)
git flow feature finish nombre-feature
```

#### Releases
```bash
# Crear release
git flow release start 1.0.0

# Finalizar release (merge a main y develop)
git flow release finish 1.0.0
```

#### Hotfixes
```bash
# Crear hotfix desde main
git flow hotfix start 1.0.1

# Finalizar hotfix (merge a main y develop)
git flow hotfix finish 1.0.1
```

### Comandos Git Flow

| Comando | Descripción |
|---------|-------------|
| `git flow init` | Inicializar Git Flow |
| `git flow feature start <name>` | Crear nueva feature |
| `git flow feature finish <name>` | Finalizar feature |
| `git flow release start <version>` | Crear release |
| `git flow release finish <version>` | Finalizar release |
| `git flow hotfix start <version>` | Crear hotfix |
| `git flow hotfix finish <version>` | Finalizar hotfix |

### Convenciones

1. **Features**: Desarrollar en ramas `feature/` desde `develop`
2. **Releases**: Crear desde `develop`, merge a `main` y `develop`
3. **Hotfixes**: Crear desde `main`, merge a `main` y `develop`
4. **Commits**: Usar mensajes descriptivos y claros
5. **Versioning**: Seguir Semantic Versioning (MAJOR.MINOR.PATCH)

## Estándares de Usabilidad Mobile

### Inputs y Botones Mobile-First

Para garantizar una experiencia táctil óptima, seguir estos estándares en toda la aplicación:

#### 📱 Inputs
- **Mobile:** `h-10` (40px altura) + `text-base` (16px texto)
- **Desktop:** `md:h-9` (36px altura) + `md:text-sm` (14px texto)
- **Patrón:** `className="h-10 md:h-9 text-base md:text-sm"`

#### 🔘 Botones Principales (Formularios)
- **Mobile:** `h-11` (44px altura) + `text-base` (16px texto)
- **Desktop:** `md:h-10` (40px altura) + `md:text-sm` (14px texto)
- **Patrón:** `className="h-11 md:h-10 text-base md:text-sm"`
- **Uso:** Botones de Submit en formularios, acciones críticas

#### 🔷 Botones Secundarios (Toolbars)
- **Mobile:** `h-10` (40px altura) + `text-base` (16px texto)
- **Desktop:** `md:h-8` (32px altura) + `md:text-sm` (14px texto)
- **Patrón:** `className="h-10 md:h-8 text-base md:text-sm"`
- **Uso:** Botones en toolbars (Exportar, Importar, Agregar, etc.)

#### 📑 Tabs/Navegación
- **Mobile:** `h-10` (40px altura) + `text-base` (16px texto)
- **Desktop:** `md:h-8` (32px altura) + `md:text-sm` (14px texto)
- **Patrón:** `className="h-10 md:h-8 text-base md:text-sm"`

#### ✅ Razones del Estándar
1. **Touch targets:** 40-44px cumple con recomendaciones Apple/Google
2. **Accesibilidad:** Elementos más fáciles de tocar
3. **iOS Safari:** 16px+ previene zoom automático
4. **Consistencia:** Experiencia uniforme en toda la app
5. **Responsive:** Elegante en desktop, usable en mobile

#### 📋 Implementado en
- Página de autenticación (`/auth`) - Botones principales (h-11/h-10)
- Modal de agregar bodegón - Botones principales (h-11/h-10)
- Vista inicio (tabs y botones) - Tabs/navegación (h-10/h-8)
- Vista localidades bodegones - Botones toolbar (h-10/h-8)
- Vista productos bodegones - Botones toolbar (h-10/h-8)
- Vista productos restaurantes - Botones toolbar (h-10/h-8)
- **Usar en:** Todos los módulos futuros con estas categorías

## Templates Disponibles

### 🚀 Uso de Templates

Para agilizar el desarrollo y garantizar consistencia, usa estos templates al crear nuevos componentes:

#### 1. **Modal con Formulario** - `modal-form-template.tsx`
```tsx
import { ModalFormTemplate } from "@/components/admin/templates/modal-form-template"

// Ejemplo de uso
<ModalFormTemplate
  open={showModal}
  onOpenChange={setShowModal}
  title="Agregar Elemento" 
  description="Completa la información"
  onSubmit={(data) => console.log(data)}
/>
```

#### 2. **Vista de Tabla** - `table-view-template.tsx`  
```tsx
import { TableViewTemplate } from "@/components/admin/templates/table-view-template"

// Ejemplo de uso
<TableViewTemplate
  title="Gestión de Elementos"
  data={elementos}
  onAdd={() => setShowAddModal(true)}
  onEdit={(item) => setEditItem(item)}
  onDelete={(item) => setDeleteItem(item)}
/>
```

#### 3. **Formulario Simple** - `simple-form-template.tsx`
```tsx
import { SimpleFormTemplate } from "@/components/admin/templates/simple-form-template"

// Ejemplo de uso
<SimpleFormTemplate
  title="Configuración"
  description="Ajusta las opciones"
  onSubmit={(data) => console.log(data)}
/>
```

#### ✅ Todos los Templates Incluyen:
- ✅ **Estándares mobile** aplicados automáticamente
- ✅ **Responsive design** (Dialog desktop, Drawer mobile) 
- ✅ **Componentes Shadcn UI** ya integrados
- ✅ **Validación básica** y manejo de estados
- ✅ **Patrones consistentes** con el resto de la app

## 🚀 Nuclear Client V2.0 - Solución Híbrida para Estabilidad SPA

### 🚨 Problema Resuelto
Al cambiar pestañas del navegador o minimizar/maximizar la ventana, los contextos de Supabase se corrompían, causando que las operaciones CRUD se colgaran indefinidamente y requirieran recargar la página. Este problema afectaba la experiencia del usuario en producción.

### ✅ Nuclear Client V2.0 - Arquitectura Híbrida
**Commit de referencia**: `2765b25` - Solución completamente estable y probada en producción.

La solución híbrida combina:
1. **Auth Listeners Deshabilitados**: Elimina la corrupción de contextos
2. **Nuclear Client Optimizado**: Cliente inteligente con auto-recovery
3. **Operaciones CRUD Centralizadas**: API unificada para todas las operaciones

### 🔧 Características del Nuclear Client V2.0

#### **Auto-Recovery Inteligente**
- ✅ **3 reintentos automáticos** con backoff exponencial
- ✅ **Detección de errores JWT/Token** para reintentos específicos
- ✅ **Validación de token con margen de 5 minutos** de seguridad
- ✅ **Cache inteligente** para reutilizar clientes válidos

#### **API Unificada**
```typescript
// 🚀 Importar Nuclear Client V2.0
import { 
  nuclearInsert,
  nuclearUpdate,
  nuclearDelete,
  nuclearSelect,
  executeNuclearQuery 
} from '@/utils/nuclear-client'
```

### 📚 Patrones de Uso Nuclear Client V2.0

#### **1. Operaciones CRUD Simples**
```typescript
// ✅ CREAR - Nuclear Insert
const { data, error } = await nuclearInsert(
  'bodegons',
  insertData,
  '*'  // select opcional
)

// ✅ ACTUALIZAR - Nuclear Update  
const { data, error } = await nuclearUpdate(
  'bodegons',
  bodegonId,
  updateData,
  '*'  // select opcional
)

// ✅ ELIMINAR - Nuclear Delete
const { error } = await nuclearDelete('bodegons', bodegonId)

// ✅ LEER - Nuclear Select
const { data, error } = await nuclearSelect(
  'bodegons',
  '*',
  { is_active: true }  // filtros opcionales
)
```

#### **2. Queries Complejas**
```typescript
// ✅ QUERIES PERSONALIZADAS - executeNuclearQuery
const { data, error } = await executeNuclearQuery(
  async (client) => {
    return await client
      .from('bodegons')
      .select(`
        *,
        bodegon_inventories(count)
      `)
      .eq('is_active', true)
      .order('name')
  },
  false,  // showUserError - opcional
  'Error personalizado'  // customErrorMessage - opcional
)
```

#### **3. Operaciones con Transacciones**
```typescript
// ✅ MÚLTIPLES OPERACIONES EN SECUENCIA
const handleComplexOperation = async () => {
  // 1. Crear registro principal
  const { data: bodegon, error: createError } = await nuclearInsert(
    'bodegons', insertData, '*'
  )
  if (createError) return

  // 2. Actualizar registros relacionados
  const { error: updateError } = await executeNuclearQuery(
    async (client) => {
      return await client
        .from('bodegon_inventories')
        .update({ bodegon_id: bodegon.id })
        .eq('temp_id', tempId)
    }
  )
  if (updateError) return

  // 3. Operación completada exitosamente
  toast.success('Operación completada exitosamente')
}
```

### 🎯 Implementado En (Nuclear V2.0)

#### **✅ Bodegones - Completamente Migrado**
- `add-bodegon-modal.tsx` - Nuclear Insert V2.0
- `edit-bodegon-modal.tsx` - Nuclear Update V2.0  
- `localidades-view.tsx` - executeNuclearQuery para cargas y Nuclear Delete
- `productos-todos-view.tsx` - Server-side pagination + filtros condicionales

#### **✅ Características Adicionales Implementadas**
- **Filtros con popover** reemplazando tabs en bodegones
- **Subcategorías condicionales** basadas en categorías seleccionadas
- **Server-side pagination** optimizada para tablas grandes

### 🔄 Patrón para Nuevos Módulos

```typescript
// 🏗️ PLANTILLA PARA NUEVOS MÓDULOS
const handleCRUDOperation = async () => {
  // Siempre usar Nuclear Client V2.0
  const { nuclearInsert, nuclearUpdate } = await import('@/utils/nuclear-client')
  
  // Operaciones automáticamente incluyen:
  // ✅ Auto-recovery con 3 reintentos
  // ✅ Validación de token inteligente
  // ✅ Manejo de errores con toast integrado
  // ✅ Cache optimizado para performance
  
  const { data, error } = await nuclearInsert('tabla', data, '*')
  if (error) return // Error ya manejado automáticamente
  
  // Continuar con lógica de negocio...
}
```

### 🛡️ Estabilidad y Seguridad

#### **Auth Context Optimizado**
- ✅ **Listeners deshabilitados** - No más corrupción por cambio de pestañas
- ✅ **Validación inicial simple** - Solo carga perfil en mount
- ✅ **Token management automático** - Nuclear Client maneja tokens

#### **Seguridad Mantenida**
- ✅ **Row Level Security (RLS)** activo en Supabase
- ✅ **Token real del usuario** siempre validado
- ✅ **Anon key pública** (comportamiento normal de Supabase)
- ✅ **Sin persistencia de sesión** en clientes nuclear

### 📈 Beneficios Comprobados

1. **🚫 Cero problemas** al cambiar pestañas
2. **🔄 Auto-recovery** automático en errores temporales  
3. **⚡ Performance mejorada** con cache inteligente
4. **🎯 UX consistente** con manejo de errores centralizado
5. **🛠️ Mantenible** con API unificada para CRUD

## Layout Global y Max-Width

### 🎯 Max-Width Global Implementado
Para mantener consistencia visual y evitar repetir código, se implementó un **max-width global de 1200px** en `admin-content.tsx`:

```tsx
<div className="flex flex-1 flex-col gap-4 p-4 sm:p-6 pt-6 sm:pt-4 pb-8 sm:pb-4 items-center">
  <div className="w-full max-w-[1200px]">
    {renderView()}
  </div>
</div>
```

### ✅ Beneficios:
- **Automático**: Todos los módulos tienen max-width sin código extra
- **Consistente**: Mismo ancho en todas las vistas
- **Responsive**: Se adapta a pantallas menores automáticamente
- **DRY**: No repetir `max-w-[1200px]` en cada vista

### 📝 Para Desarrolladores:

#### **Vistas Principales/Listados** (1200px automático):
- ❌ **NO agregar** `max-w-[1200px]` en nuevas vistas principales
- ✅ **Solo usar** contenedores base como `<div className="space-y-6">`
- ✅ El max-width se aplica automáticamente (pedidos, productos, categorías, etc.)

#### **Vistas Internas/Formularios** (896px manual):
- ✅ **Usar** `max-w-4xl mx-auto` en vistas internas/formularios
- ✅ **Incluir** header con ArrowLeftIcon para consistencia
- ✅ **Ejemplos**: Agregar/Editar productos, Detalles de pedido, Formularios

### 🔙 **Header Estándar para Vistas Internas:**
```tsx
{/* Header */}
<div className="flex items-center gap-4">
  <Button variant="ghost" size="sm" onClick={handleBack} className="h-10 md:h-8">
    <ArrowLeftIcon className="w-4 h-4" />
  </Button>
  <h1 className="text-xl md:text-2xl font-bold text-gray-900">
    {título_dinámico}
  </h1>
</div>
```

**Usar en todas las vistas internas/secundarias para mantener consistencia UX.**

## Notas Importantes

- Cada sección (Bodegones/Restaurantes) tiene su propia gestión independiente
- El sistema es completamente SPA sin cambios de URL
- Mantener consistencia en la estructura de archivos y naming conventions
- **Usar Git Flow** para todas las nuevas funcionalidades y releases
- **Aplicar estándares mobile** en todos los nuevos componentes con formularios
- **OBLIGATORIO: Usar Nuclear Client V2.0** para todas las operaciones CRUD
- **Max-width global**: Ya no es necesario agregar max-width en nuevas vistas
- **Referencia estable**: Commit `2765b25` funciona perfectamente en producción

## ⚠️ Troubleshooting Nuclear Client V2.0

### 🔍 Diagnóstico de Problemas

#### **1. Error "Sesión expirada"**
```bash
# Síntoma: Toast "Sesión expirada - por favor inicia sesión nuevamente"
# Causa: Token localStorage expirado o corrupto
# Solución: Usuario debe hacer logout/login
```

#### **2. Operaciones que Fallan**
```bash  
# Síntoma: Reintentos automáticos sin éxito
# Causa posible: Problemas de red o RLS
# Diagnóstico: Revisar console.log para errores específicos
```

#### **3. Performance Lenta**
```bash
# Síntoma: Operaciones tardan más de 3-5 segundos
# Causa posible: Cache corrupto
# Solución: Usar clearNuclearCache() manualmente
```

### 🛠️ Herramientas de Debugging

#### **Limpiar Cache Nuclear**
```typescript
import { clearNuclearCache } from '@/utils/nuclear-client'

// En caso de problemas, limpiar cache
const handleClearCache = () => {
  clearNuclearCache()
  toast.success('Cache nuclear limpiado')
}
```

#### **Monitoring en Console**
- ✅ `🚫 Nuclear Client:` - Errores de token/validación
- ✅ `🔄 Reintentando operación nuclear` - Auto-recovery en progreso  
- ✅ `💥 Nuclear Query Error` - Errores finales tras reintentos
- ✅ `🧹 Nuclear Client cache limpiado` - Cache resetado

### 📋 Checklist para Nuevos Desarrolladores

#### **✅ Al Implementar Nuevos Módulos:**
1. **Importar Nuclear Client V2.0** - Nunca crear clientes manuales
2. **Usar utilidades CRUD** - nuclearInsert, nuclearUpdate, etc.
3. **No manejar errores manualmente** - Nuclear Client tiene toast integrado
4. **No usar contextos Supabase** para operaciones críticas
5. **Probar cambios de pestañas** - Validar que operaciones no fallan

#### **🚫 Qué NO Hacer:**
- ❌ Crear clientes Supabase manuales con createClient()
- ❌ Usar useSupabase() para operaciones CRUD críticas  
- ❌ Manejar token manualmente del localStorage
- ❌ Reactivar auth listeners sin coordinación
- ❌ Implementar reintentos manuales (ya incluidos)

## Optimización de Tablas con Paginación Server-Side

### 🚀 Problema Resuelto
Las tablas con muchas entradas (ej: 784 productos) causaban carga lenta al cargar todos los registros en el cliente. Implementamos **paginación del lado del servidor** para optimizar el rendimiento.

### ✅ Patrón de Optimización Implementado

#### **Templates Disponibles:**
1. **`PaginatedTableTemplate`** - Componente reutilizable para tablas paginadas
2. **`usePaginatedData`** - Hook personalizado para manejo de datos paginados  
3. **`executePaginatedQuery`** - Utilidad para queries Supabase optimizadas

#### **Características Implementadas:**
- ✅ **Server-side pagination** - Solo carga registros de la página actual
- ✅ **Búsqueda con debounce** - 500ms delay para evitar consultas excesivas
- ✅ **Filtros múltiples** - Estado, categoría, subcategoría
- ✅ **Consultas optimizadas** - Count query separada de data query
- ✅ **Mobile responsive** - Paginación adaptativa para dispositivos móviles

### 📊 Mejora de Rendimiento

**Antes (Client-side):**
- Cargaba 784 productos completos
- Tiempo: ~2-3 segundos
- Transferencia: ~200KB+ por carga

**Después (Server-side):**
- Carga solo 10-25 productos por página
- Tiempo: ~200-500ms
- Transferencia: ~10-20KB por página
- **Mejora: 80-85% reducción en tiempo de carga**

### 🛠️ Implementación para Nuevas Tablas

#### **Paso 1: Usar el Hook**
```typescript
import { usePaginatedData } from '@/hooks/use-paginated-data'
import { executePaginatedQuery, buildStatusFilters } from '@/utils/supabase-query-builder'

const queryBuilder = useCallback(async (params) => {
  const statusFilters = buildStatusFilters(params.filters.statusFilters || [], {
    'Activos': 'is_active.eq.true',
    'Inactivos': 'is_active.eq.false'
  })

  return await executePaginatedQuery({
    tableName: 'mi_tabla',
    select: '*, categorias(name)',
    currentPage: params.currentPage,
    pageSize: params.pageSize,
    searchTerm: params.searchTerm,
    searchColumns: ['name', 'codigo'],
    filters: {
      categoria_id: params.filters.selectedCategories
    },
    orFilters: statusFilters,
    orderBy: { column: 'created_date', ascending: false }
  })
}, [])

const {
  data, totalCount, isLoading, error,
  currentPage, pageSize, searchTerm,
  setCurrentPage, setPageSize, setSearchTerm, setFilters
} = usePaginatedData(queryBuilder)
```

#### **Paso 2: Usar el Template**
```typescript
import { PaginatedTableTemplate } from '@/components/admin/templates/paginated-table-template'

const columns = [
  { key: 'name', label: 'Nombre' },
  { key: 'codigo', label: 'Código' },
  { key: 'is_active', label: 'Estado', render: (item) => (
    <Badge variant={item.is_active ? "default" : "secondary"}>
      {item.is_active ? 'Activo' : 'Inactivo'}
    </Badge>
  )}
]

<PaginatedTableTemplate
  data={data}
  columns={columns}
  totalCount={totalCount}
  isLoading={isLoading}
  error={error}
  title="Mi Tabla Optimizada"
  currentPage={currentPage}
  pageSize={pageSize}
  searchTerm={searchTerm}
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
  onSearchChange={setSearchTerm}
  headerActions={<Button>Agregar</Button>}
  filters={<MisFiltros />}
/>
```

### 📚 Aplicado En:
- ✅ **Productos Bodegón**: `productos-todos-view.tsx` (784 → 10-25 productos por página)

### 🔄 Para Implementar En:
- **Productos Restaurantes**: Aplicar mismo patrón
- **Inventarios**: Para tablas de stock con muchas entradas  
- **Pedidos**: Para historial de pedidos extenso
- **Usuarios**: Para gestión de usuarios con muchos registros
- **Cualquier tabla con +100 registros**

### ⚡ Best Practices:
1. **Usar server-side pagination** siempre que haya +50 registros
2. **Implementar debounce** en búsquedas (500ms recomendado)
3. **Separar count query** de data query para mejor rendimiento
4. **Cachear consultas** cuando sea apropiado
5. **Usar skeletons** durante carga para mejor UX