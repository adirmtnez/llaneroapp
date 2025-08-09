import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Only process specific paths to avoid conflicts
  const { pathname } = request.nextUrl

  // Protected routes - require authentication and admin role
  const isAdminPath = pathname.startsWith('/admin')
  const isAuthPath = pathname.startsWith('/auth')

  // Skip middleware for non-protected paths
  if (!isAdminPath && !isAuthPath) {
    return NextResponse.next()
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  try {
    // Get session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Redirect to login if accessing protected route without session
    if (isAdminPath && !session) {
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    // If accessing admin route with session, check user role
    if (isAdminPath && session) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const hasAdminAccess = userProfile && (userProfile.role === 1 || userProfile.role === 2)

      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/auth', request.url))
      }
    }

    // Redirect to admin if accessing auth routes with active session and admin role
    if (isAuthPath && session) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

      if (userProfile && (userProfile.role === 1 || userProfile.role === 2)) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  } catch (error) {
    // If any error occurs, let the request continue
    console.error('Middleware error:', error)
  }

  return response
}

export const config = {
  matcher: [
    // Temporarily disable all middleware
  ],
}