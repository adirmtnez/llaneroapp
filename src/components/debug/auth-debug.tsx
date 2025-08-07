"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AuthDebugProps {
  show?: boolean
}

export function AuthDebug({ show = false }: AuthDebugProps) {
  const { user, loading } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [events, setEvents] = useState<string[]>([])

  const addEvent = (event: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setEvents(prev => [`${timestamp}: ${event}`, ...prev.slice(0, 9)])
  }

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionInfo(session)
    }

    checkSession()

    // Listen for auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        addEvent(`Auth state changed: ${event}`)
        setSessionInfo(session)
      }
    )

    // Listen for custom events
    const handleAuthRestored = () => {
      addEvent('authRestored event fired')
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        addEvent('Page became visible')
      } else {
        addEvent('Page became hidden')
      }
    }

    window.addEventListener('authRestored', handleAuthRestored)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('authRestored', handleAuthRestored)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const refreshSession = async () => {
    addEvent('Manual session refresh triggered')
    const { data: { session } } = await supabase.auth.getSession()
    setSessionInfo(session)
  }

  const triggerAuthRestored = () => {
    addEvent('Manual authRestored event triggered')
    window.dispatchEvent(new CustomEvent('authRestored'))
  }

  if (!show) return null

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-auto z-50 bg-white shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Auth Debug
          <div className="flex gap-1">
            <Badge variant={user ? 'default' : 'destructive'} className="text-xs">
              {user ? 'Authenticated' : 'Not Auth'}
            </Badge>
            <Badge variant={loading ? 'secondary' : 'outline'} className="text-xs">
              {loading ? 'Loading' : 'Ready'}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          <div className="text-xs font-medium">Session Info:</div>
          <div className="text-xs text-muted-foreground">
            {sessionInfo ? (
              <div>
                <div>User ID: {sessionInfo.user?.id?.slice(0, 8)}...</div>
                <div>Expires: {new Date(sessionInfo.expires_at * 1000).toLocaleTimeString()}</div>
              </div>
            ) : (
              'No session'
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium">Recent Events:</div>
          <div className="text-xs text-muted-foreground max-h-32 overflow-y-auto">
            {events.length > 0 ? (
              events.map((event, i) => (
                <div key={i} className="truncate">{event}</div>
              ))
            ) : (
              'No events yet'
            )}
          </div>
        </div>

        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={refreshSession} className="text-xs h-6">
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={triggerAuthRestored} className="text-xs h-6">
            Trigger Event
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}