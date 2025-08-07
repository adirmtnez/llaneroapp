'use client'

import { AdminContent } from '@/components/admin/admin-content'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { LoadingScreen } from '@/components/ui/loading-screen'

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