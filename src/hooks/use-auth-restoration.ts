"use client"

import { useEffect, useRef } from 'react'

interface UseAuthRestorationOptions {
  onAuthRestored?: () => void
  resetStates?: () => void
  delay?: number
}

/**
 * Hook to handle authentication restoration when user switches back to the tab
 * This ensures that components properly reload data and reset states when auth is restored
 */
export function useAuthRestoration({
  onAuthRestored,
  resetStates,
  delay = 300
}: UseAuthRestorationOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleAuthRestored = () => {
      console.log('Auth restoration detected')
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Reset states immediately if provided
      if (resetStates) {
        resetStates()
      }
      
      // Execute the restoration callback after a delay
      if (onAuthRestored) {
        timeoutRef.current = setTimeout(() => {
          console.log('Executing auth restoration callback')
          onAuthRestored()
        }, delay)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, triggering restoration')
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        // Reset states immediately if provided
        if (resetStates) {
          resetStates()
        }
        
        // Execute the restoration callback after a delay
        if (onAuthRestored) {
          timeoutRef.current = setTimeout(() => {
            console.log('Executing visibility restoration callback')
            onAuthRestored()
          }, delay)
        }
      }
    }

    // Listen for auth restoration and visibility changes
    window.addEventListener('authRestored', handleAuthRestored)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      window.removeEventListener('authRestored', handleAuthRestored)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [onAuthRestored, resetStates, delay])

  return {
    // Utility function to manually trigger auth restoration
    triggerAuthRestoration: () => {
      if (onAuthRestored) {
        onAuthRestored()
      }
    }
  }
}