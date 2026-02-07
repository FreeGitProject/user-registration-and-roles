import React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AuthProvider } from "@/components/auth-provider"
import { UserNav } from "@/components/user-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role === "admin") {
    redirect("/admin")
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-6">
              <h1 className="text-xl font-bold">Dashboard</h1>
              <nav className="hidden md:flex items-center gap-4">
                <a href="/dashboard" className="text-sm font-medium hover:text-primary">
                  Overview
                </a>
                <a href="/dashboard/profile" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Profile
                </a>
                <a href="/dashboard/orders" className="text-sm font-medium text-muted-foreground hover:text-primary">
                  Orders
                </a>
              </nav>
            </div>
            <UserNav user={session} />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </AuthProvider>
  )
}
