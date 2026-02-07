"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/cart-provider"
import { 
  ArrowLeft, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Loader2, 
  Package,
  Truck,
  Shield,
  RotateCcw
} from "lucide-react"
import type { Product } from "@/lib/types"

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addItem } = useCart()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        if (res.ok) {
          const data = await res.json()
          setProduct(data)
        } else if (res.status === 404) {
          setError("Product not found")
        } else {
          setError("Failed to load product")
        }
      } catch {
        setError("An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const handleAddToCart = () => {
    if (product) {
      addItem(product, quantity)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container py-16">
          <div className="flex flex-col items-center justify-center text-center py-24">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold">{error || "Product not found"}</h1>
            <p className="text-muted-foreground mt-2">
              The product you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild className="mt-6">
              <Link href="/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 10

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/products">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Products
            </Link>
          </Button>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={product.image || "/placeholder.svg?height=600&width=600"}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{product.category}</Badge>
                {product.featured && <Badge>Featured</Badge>}
              </div>
              
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
              
              <div className="mt-4">
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
              </div>

              <Separator className="my-6" />

              <div className="prose prose-sm text-muted-foreground">
                <p>{product.description}</p>
              </div>

              {/* Stock Status */}
              <div className="mt-6">
                {isOutOfStock ? (
                  <Badge variant="destructive" className="text-sm">Out of Stock</Badge>
                ) : isLowStock ? (
                  <Badge variant="secondary" className="text-sm bg-yellow-100 text-yellow-800">
                    Only {product.stock} left in stock
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
                    In Stock ({product.stock} available)
                  </Badge>
                )}
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="mt-6">
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center text-lg font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="mt-8 flex gap-4">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                </Button>
              </div>

              <Separator className="my-8" />

              {/* Features */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Free Shipping</p>
                    <p className="text-muted-foreground">On orders over $50</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Secure Payment</p>
                    <p className="text-muted-foreground">100% protected</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <RotateCcw className="h-5 w-5 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Easy Returns</p>
                    <p className="text-muted-foreground">30-day policy</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
