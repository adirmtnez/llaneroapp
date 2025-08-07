'use client'

import dynamic from 'next/dynamic'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { LoadingScreen } from '@/components/ui/loading-screen'

// ✅ Client-side only rendering para evitar hidratación problemática
const AdminContent = dynamic(
  () => import('@/components/admin/admin-content').then(mod => ({ default: mod.AdminContent })),
  { 
    ssr: false,
    loading: () => <LoadingScreen message="Cargando dashboard..." />
  }
)

export default function AdminPage() {
  const { user, loading, canAccessAdmin } = useAuthGuard()

  if (loading) {
    return <LoadingScreen message="Verificando acceso..." />
  }

  if (!user || !canAccessAdmin) {
    return <LoadingScreen message="Redirigiendo al login..." />
  }

  return <AdminContent />
}