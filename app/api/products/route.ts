import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET all products (public)
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get("category")
    const featured = searchParams.get("featured")
    const limit = searchParams.get("limit")
    
    const query: Record<string, unknown> = {}
    
    if (category && category !== "all") {
      query.category = category
    }
    
    if (featured === "true") {
      query.featured = true
    }
    
    let cursor = db.collection("products").find(query).sort({ createdAt: -1 })
    
    if (limit) {
      cursor = cursor.limit(parseInt(limit))
    }
    
    const products = await cursor.toArray()
    
    return NextResponse.json(products)
  } catch (error) {
    console.error("Get products error:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST create product (admin only)
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }
    
    const body = await request.json()
    const { name, description, price, stock, category, image, featured } = body
    
    if (!name || !description || price === undefined || stock === undefined || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    const db = await getDatabase()
    
    const product = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category,
      image: image || "/placeholder.svg?height=400&width=400",
      featured: featured || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection("products").insertOne(product)
    
    return NextResponse.json(
      { message: "Product created successfully", productId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create product error:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}
