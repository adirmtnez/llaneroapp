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

## Notas Importantes

- Cada sección (Bodegones/Restaurantes) tiene su propia gestión independiente
- El sistema es completamente SPA sin cambios de URL
- Mantener consistencia en la estructura de archivos y naming conventions
- **Usar Git Flow** para todas las nuevas funcionalidades y releases