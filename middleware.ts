import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)

interface UserPayload {
  id: string
  email: string
  name: string
  role: "admin" | "user"
}

async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as UserPayload
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("auth-token")?.value

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/"]
  const isPublicRoute = publicRoutes.includes(pathname)

  // If user is not authenticated
  if (!token) {
    // Allow access to public routes
    if (isPublicRoute) {
      return NextResponse.next()
    }
    // Redirect to login for protected routes
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Verify the token
  const user = await verifyToken(token)

  if (!user) {
    // Invalid token, clear it and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url))
    response.cookies.delete("auth-token")
    return response
  }

  // If authenticated user tries to access login/register, redirect to their dashboard
  if (pathname === "/login" || pathname === "/register") {
    if (user.role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Role-based access control
  if (pathname.startsWith("/admin")) {
    if (user.role !== "admin") {
      // Non-admin users cannot access admin routes
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  if (pathname.startsWith("/dashboard")) {
    if (user.role === "admin") {
      // Admin users should use the admin dashboard
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
}
