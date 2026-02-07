"use client"

import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/components/cart-provider"
import type { Product } from "@/lib/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()

  const isOutOfStock = product.stock === 0

  return (
    <Card className="group overflow-hidden">
      <Link href={`/products/${product._id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={product.image || "/placeholder.svg?height=400&width=400"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link href={`/products/${product._id}`}>
              <h3 className="font-semibold text-lg leading-tight hover:underline line-clamp-1">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
          </div>
          {product.featured && (
            <Badge variant="secondary" className="shrink-0">Featured</Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <span className="text-xl font-bold">${product.price.toFixed(2)}</span>
        <Button
          size="sm"
          onClick={() => addItem(product)}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}
