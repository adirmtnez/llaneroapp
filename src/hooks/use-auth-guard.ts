"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export function useAuthGuard() {
  const { user, loading, canAccessAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth')
        return
      }

      if (!canAccessAdmin()) {
        router.push('/auth')
        return
      }
    }
  }, [user, loading, canAccessAdmin, router])

  return { user, loading, canAccessAdmin: canAccessAdmin() }
}