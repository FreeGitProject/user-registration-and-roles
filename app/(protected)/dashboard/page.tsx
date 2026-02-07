"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ShoppingCart, CreditCard, User, Loader2, Store } from "lucide-react"
import type { Order } from "@/lib/types"

function getStatusColor(status: string) {
  switch (status) {
    case "delivered":
      return "text-green-600"
    case "shipped":
      return "text-blue-600"
    case "processing":
      return "text-yellow-600"
    case "pending":
      return "text-gray-600"
    case "cancelled":
      return "text-red-600"
    default:
      return "text-muted-foreground"
  }
}

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders")
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch {
        console.error("Failed to fetch orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "processing" || o.status === "shipped"
  ).length
  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h2>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime purchases
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              {user?.role === "admin" ? "Admin Account" : "Member Account"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              {recentOrders.length > 0 ? "Your latest orders" : "No orders yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No orders yet</p>
                <Link href="/products" className="text-sm text-primary hover:underline mt-2">
                  Start shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order._id?.toString()} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium font-mono text-sm">
                        #{order._id?.toString().slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${order.total.toFixed(2)}</p>
                      <p className={`text-sm capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to do</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/products" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Store className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Browse Products</p>
                <p className="text-sm text-muted-foreground">Discover new items to purchase</p>
              </div>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Update Profile</p>
                <p className="text-sm text-muted-foreground">Change your personal information</p>
              </div>
            </Link>
            <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">View All Orders</p>
                <p className="text-sm text-muted-foreground">See your complete order history</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
