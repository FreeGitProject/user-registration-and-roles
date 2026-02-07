import { NextResponse } from "next/server"
//import clientPromise from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { cookies } from "next/headers"
import { getDatabase } from "@/lib/mongodb"
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const role = searchParams.get("role") || "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    //const client = await clientPromise
    //const db = client.db("ecommerce")
const db = await getDatabase()
    // Build query
    const query: Record<string, unknown> = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    if (role !== "all") {
      query.role = role
    }

    // Get users with order counts
    const users = await db
      .collection("users")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "orders",
            localField: "_id",
            foreignField: "userId",
            as: "orders",
          },
        },
        {
          $addFields: {
            orderCount: { $size: "$orders" },
          },
        },
        {
          $project: {
            password: 0,
            orders: 0,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
      ])
      .toArray()

    const total = await db.collection("users").countDocuments(query)

    // Get stats
    const totalUsers = await db.collection("users").countDocuments()
    const adminUsers = await db.collection("users").countDocuments({ role: "admin" })
    
    // New users this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const newThisMonth = await db.collection("users").countDocuments({
      createdAt: { $gte: startOfMonth },
    })

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        newThisMonth,
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
