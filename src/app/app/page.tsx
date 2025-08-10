'use client'

import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import { LoadingScreen } from '@/components/ui/loading-screen'

// Carga dinámica del contenido móvil
const AppContent = dynamic(
  () => import('@/components/app/app-content').then(mod => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => <LoadingScreen message="Cargando aplicación..." />
  }
)

// Carga dinámica del contenido desktop
const DesktopContent = dynamic(
  () => import('@/components/app/desktop/desktop-content'),
  { 
    ssr: false,
    loading: () => <LoadingScreen message="Cargando aplicación..." />
  }
)

// Carga dinámica de la pantalla de auth para clientes
const AppAuthScreen = dynamic(
  () => import('@/components/app/app-auth-screen'),
  { 
    ssr: false,
    loading: () => <LoadingScreen message="Cargando..." />
  }
)

export default function AppPage() {
  const { user, loading } = useAuth()
  const isMobile = useIsMobile()

  if (loading) {
    return <LoadingScreen message="Cargando aplicación..." />
  }

  if (!isMobile) {
    return <DesktopContent />
  }

  // ✅ Permitir acceso a invitados - AppContent maneja usuario null
  return <AppContent />
}