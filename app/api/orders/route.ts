import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

// GET orders (user sees their orders, admin sees all)
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const db = await getDatabase()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    
    const query: Record<string, unknown> = {}
    
    // If not admin, only show user's own orders
    if (payload.role !== "admin") {
      query.userId = new ObjectId(payload.id)
    }
    
    if (status && status !== "all") {
      query.status = status
    }
    
    const orders = await db.collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(orders)
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}

// POST create order
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const payload = await verifyToken(token)
    
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const body = await request.json()
    const { items, shippingAddress } = body
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 })
    }
    
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 })
    }
    
    const db = await getDatabase()
    
    // Verify products exist and calculate total
    let total = 0
    const orderItems = []
    
    for (const item of items) {
      const product = await db.collection("products").findOne({ 
        _id: new ObjectId(item.productId) 
      })
      
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        )
      }
      
      total += product.price * item.quantity
      
      orderItems.push({
        productId: item.productId,
        name: product.name,
        quantity: item.quantity,
        price: product.price,
        image: product.image,
      })
      
      // Update stock
      await db.collection("products").updateOne(
        { _id: new ObjectId(item.productId) },
        { $inc: { stock: -item.quantity } }
      )
    }
    
    // Get user info
    const user = await db.collection("users").findOne({ 
      _id: new ObjectId(payload.id) 
    })
    
    const order = {
      userId: new ObjectId(payload.id),
      userEmail: user?.email || payload.email,
      userName: user?.name || "Unknown",
      items: orderItems,
      total,
      shippingAddress,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    const result = await db.collection("orders").insertOne(order)
    
    return NextResponse.json(
      { message: "Order created successfully", orderId: result.insertedId },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    )
  }
}
