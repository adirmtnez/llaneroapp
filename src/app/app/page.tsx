'use client'

import dynamic from 'next/dynamic'
import { useAuthGuard } from '@/hooks/use-auth-guard'
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

export default function AppPage() {
  const { user, loading } = useAuthGuard()
  const isMobile = useIsMobile()

  if (loading) {
    return <LoadingScreen message="Verificando acceso..." />
  }

  if (!user) {
    return <LoadingScreen message="Redirigiendo al login..." />
  }

  if (!isMobile) {
    return <DesktopContent />
  }

  return <AppContent />
}