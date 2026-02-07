import React from "react"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { AuthProvider } from "@/components/auth-provider"
import { AdminSidebar } from "@/components/admin-sidebar"
import { UserNav } from "@/components/user-nav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  if (session.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-50 border-b bg-background">
          <div className="flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <UserNav user={session} />
          </div>
        </header>
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
