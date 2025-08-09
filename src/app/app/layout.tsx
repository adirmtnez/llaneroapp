'use client'

import { useAuthGuard } from '@/hooks/use-auth-guard'
import { useIsMobile } from '@/hooks/use-mobile'
import { redirect } from 'next/navigation'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuthGuard()
  const isMobile = useIsMobile()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    redirect('/auth')
  }

  // Por ahora solo soportamos móvil
  if (!isMobile) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Versión Desktop en Desarrollo</h1>
          <p className="text-gray-600">Por favor, accede desde un dispositivo móvil.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}