import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

// GET all unique categories
export async function GET() {
  try {
    const db = await getDatabase()
    
    const categories = await db.collection("products").distinct("category")
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}
