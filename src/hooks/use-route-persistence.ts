"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const ROUTE_STORAGE_KEY = 'lastVisitedRoute'

export function useRoutePersistence() {
  const router = useRouter()
  const pathname = usePathname()

  // Save current route to localStorage whenever it changes
  useEffect(() => {
    // Only save routes that are not auth-related
    if (pathname && !pathname.startsWith('/auth') && !pathname.startsWith('/login')) {
      localStorage.setItem(ROUTE_STORAGE_KEY, pathname)
    }
  }, [pathname])

  // Restore last visited route on app initialization
  const restoreLastRoute = () => {
    try {
      const lastRoute = localStorage.getItem(ROUTE_STORAGE_KEY)
      if (lastRoute && lastRoute !== pathname) {
        // Only redirect if we're currently on the root page
        if (pathname === '/' || pathname === '/admin') {
          router.push(lastRoute)
          return true
        }
      }
    } catch (error) {
      console.error('Error restoring last route:', error)
    }
    return false
  }

  // Clear saved route (useful for logout)
  const clearSavedRoute = () => {
    try {
      localStorage.removeItem(ROUTE_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing saved route:', error)
    }
  }

  return {
    restoreLastRoute,
    clearSavedRoute,
    currentRoute: pathname
  }
}