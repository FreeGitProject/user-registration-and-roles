import { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "user"
  phone?: string
  address?: Address
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Order {
  _id?: ObjectId
  userId: ObjectId
  userEmail: string
  userName: string
  items: OrderItem[]
  total: number
  shippingAddress: Address
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled"
  createdAt: Date
  updatedAt: Date
}

export interface OrderItem {
  productId: string
  name: string
  quantity: number
  price: number
  image?: string
}

export interface Product {
  _id?: ObjectId
  name: string
  description: string
  price: number
  stock: number
  category: string
  image?: string
  featured?: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CartItem {
  product: Product
  quantity: number
}
