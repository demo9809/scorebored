import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create client for auth state
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // 1. Auth Guard
  if (!user && (url.pathname.startsWith("/admin") || url.pathname.startsWith("/judge"))) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  // 2. Role Guard
  if (user) {
    // Fetch profile to get role
    // Note: We can't use supabase-js regular client here easily without making a DB call.
    // Ideally role is in User Metadata to avoid DB call in middleware?
    // In create-judge.ts we set user_metadata: { role: 'judge' }.
    // So we can check user.user_metadata.role
    
    const role = user.user_metadata.role

    if (url.pathname.startsWith("/admin") && role !== "admin") {
      // If judge tries to access admin, redirect to judge dashboard
      if (role === "judge") {
        url.pathname = "/judge"
        return NextResponse.redirect(url)
      }
       // If no role or unknown, redirect to home or unauthorized
       url.pathname = "/" // or /unauthorized
       return NextResponse.redirect(url)
    }

    if (url.pathname.startsWith("/judge") && role !== "judge" && role !== "admin") {
       // Allow admin to access judge view? Maybe useful for testing.
       // But strictly:
       if (role === "admin") {
         // Admin is allowed everything usually/
       } else {
         url.pathname = "/"
         return NextResponse.redirect(url)
       }
    }
    
    // 3. Login Redirect
    // If logged in and at /login, redirect to dashboard based on role
    if (url.pathname === "/login") {
      if (role === "admin") {
        url.pathname = "/admin"
      } else if (role === "judge") {
        url.pathname = "/judge"
      } else {
        url.pathname = "/"
      }
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
