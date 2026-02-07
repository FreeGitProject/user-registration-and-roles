import { NextResponse } from "next/server"
//import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { getDatabase } from "@/lib/mongodb"
interface BulkProduct {
  name: string
  description?: string
  price: number
  stock: number
  category?: string
  image?: string
  featured?: boolean
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { products } = body as { products: BulkProduct[] }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: "Products array is required" },
        { status: 400 }
      )
    }

    // Validate products
    const errors: { row: number; errors: string[] }[] = []
    const validProducts: BulkProduct[] = []

    products.forEach((product, index) => {
      const rowErrors: string[] = []

      if (!product.name || typeof product.name !== "string" || product.name.trim() === "") {
        rowErrors.push("Name is required")
      }

      if (product.price === undefined || product.price === null) {
        rowErrors.push("Price is required")
      } else if (typeof product.price !== "number" || product.price < 0) {
        rowErrors.push("Price must be a positive number")
      }

      if (product.stock === undefined || product.stock === null) {
        rowErrors.push("Stock is required")
      } else if (typeof product.stock !== "number" || product.stock < 0 || !Number.isInteger(product.stock)) {
        rowErrors.push("Stock must be a non-negative integer")
      }

      if (rowErrors.length > 0) {
        errors.push({ row: index + 2, errors: rowErrors }) // +2 for header row and 0-indexing
      } else {
        validProducts.push({
          name: product.name.trim(),
          description: product.description?.trim() || "",
          price: product.price,
          stock: product.stock,
          category: product.category?.trim() || "Uncategorized",
          image: product.image?.trim() || "",
          featured: product.featured || false,
        })
      }
    })

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation errors",
          details: errors,
          validCount: validProducts.length,
          errorCount: errors.length,
        },
        { status: 400 }
      )
    }

    //const client = await clientPromise
    //const db = client.db("ecommerce")
const db = await getDatabase()

    const now = new Date()
    const documentsToInsert = validProducts.map((product) => ({
      ...product,
      createdAt: now,
      updatedAt: now,
    }))

    const result = await db.collection("products").insertMany(documentsToInsert)

    return NextResponse.json({
      success: true,
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    })
  } catch (error) {
    console.error("Error bulk inserting products:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
