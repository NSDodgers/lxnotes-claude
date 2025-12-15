import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth', '/demo']

// Routes that require super admin access
const SUPER_ADMIN_ROUTES = ['/settings/email', '/admin']

import { SUPER_ADMIN_EMAIL } from '@/lib/auth/constants'

export async function updateSession(request: NextRequest) {
    const { searchParams, pathname } = request.nextUrl

    // If there's a code parameter at the root, redirect to the auth callback
    // This handles cases where Supabase redirects to / instead of /auth/callback
    const code = searchParams.get('code')
    if (code && pathname === '/') {
        const callbackUrl = new URL('/auth/callback', request.url)
        callbackUrl.search = request.nextUrl.search
        return NextResponse.redirect(callbackUrl)
    }

    // Check if Supabase environment variables are configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If Supabase is not configured, allow public routes and redirect protected routes
    if (!supabaseUrl || !supabaseAnonKey) {
        const isPublicRoute = PUBLIC_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        )
        
        if (isPublicRoute) {
            return NextResponse.next()
        }
        
        // Redirect protected routes to home if Supabase is not configured
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            request.cookies.set(name, value)
                        )
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        )
                    },
                },
            }
        )

        // Refresh session if expired - required for Server Components
        // https://supabase.com/docs/guides/auth/server-side/nextjs
        const {
            data: { user },
        } = await supabase.auth.getUser()

        // Check if current route is public
        const isPublicRoute = PUBLIC_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        )

        // Check if current route requires super admin
        const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        )

        // If not authenticated and trying to access protected route
        if (!user && !isPublicRoute) {
            const redirectUrl = new URL('/', request.url)
            return NextResponse.redirect(redirectUrl)
        }

        // If trying to access super admin route without being super admin
        if (isSuperAdminRoute && user?.email !== SUPER_ADMIN_EMAIL) {
            const redirectUrl = new URL('/', request.url)
            return NextResponse.redirect(redirectUrl)
        }

        return response
    } catch (error) {
        // If Supabase operations fail, log error and allow public routes
        console.error('Middleware error:', error)
        
        const isPublicRoute = PUBLIC_ROUTES.some(
            (route) => pathname === route || pathname.startsWith(`${route}/`)
        )
        
        if (isPublicRoute) {
            return NextResponse.next()
        }
        
        // Redirect protected routes to home on error
        const redirectUrl = new URL('/', request.url)
        return NextResponse.redirect(redirectUrl)
    }
}
