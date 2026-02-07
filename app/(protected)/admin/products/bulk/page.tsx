"use client"

import React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from "xlsx"

interface ParsedProduct {
  name: string
  description: string
  price: number
  stock: number
  category: string
  image: string
  featured: boolean
}

interface ValidationError {
  row: number
  errors: string[]
}

export default function BulkProductsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean
    count: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const downloadTemplate = () => {
    const templateData = [
      {
        name: "Example Product 1",
        description: "This is a sample product description",
        price: 29.99,
        stock: 100,
        category: "Electronics",
        image: "https://example.com/image1.jpg",
        featured: "false",
      },
      {
        name: "Example Product 2",
        description: "Another sample product",
        price: 49.99,
        stock: 50,
        category: "Clothing",
        image: "https://example.com/image2.jpg",
        featured: "true",
      },
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Products")

    // Set column widths
    ws["!cols"] = [
      { wch: 25 }, // name
      { wch: 40 }, // description
      { wch: 10 }, // price
      { wch: 10 }, // stock
      { wch: 15 }, // category
      { wch: 40 }, // image
      { wch: 10 }, // featured
    ]

    XLSX.writeFile(wb, "product_template.xlsx")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setUploadResult(null)
    setValidationErrors([])
    parseFile(selectedFile)
  }

  const parseFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[]

      const errors: ValidationError[] = []
      const products: ParsedProduct[] = []

      jsonData.forEach((row, index) => {
        const rowErrors: string[] = []
        const rowNum = index + 2 // +2 for header row and 0-indexing

        // Validate name
        if (!row.name || String(row.name).trim() === "") {
          rowErrors.push("Name is required")
        }

        // Validate price
        const price = Number(row.price)
        if (isNaN(price) || price < 0) {
          rowErrors.push("Price must be a positive number")
        }

        // Validate stock
        const stock = Number(row.stock)
        if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
          rowErrors.push("Stock must be a non-negative integer")
        }

        if (rowErrors.length > 0) {
          errors.push({ row: rowNum, errors: rowErrors })
        }

        products.push({
          name: String(row.name || "").trim(),
          description: String(row.description || "").trim(),
          price: isNaN(price) ? 0 : price,
          stock: isNaN(stock) ? 0 : Math.floor(stock),
          category: String(row.category || "Uncategorized").trim(),
          image: String(row.image || "").trim(),
          featured:
            String(row.featured || "").toLowerCase() === "true" ||
            row.featured === true,
        })
      })

      setParsedProducts(products)
      setValidationErrors(errors)

      if (errors.length > 0) {
        toast({
          title: "Validation Issues",
          description: `Found ${errors.length} rows with errors. Please fix them before uploading.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      toast({
        title: "Error",
        description: "Failed to parse the Excel file. Please check the format.",
        variant: "destructive",
      })
    }
  }

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Upload",
        description: "Please fix all validation errors first.",
        variant: "destructive",
      })
      return
    }

    if (parsedProducts.length === 0) {
      toast({
        title: "No Products",
        description: "Please select a file with products to upload.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    try {
      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: parsedProducts }),
      })

      const data = await response.json()

      if (response.ok) {
        setUploadResult({ success: true, count: data.insertedCount })
        toast({
          title: "Success",
          description: `Successfully uploaded ${data.insertedCount} products`,
        })
      } else {
        if (data.details) {
          setValidationErrors(data.details)
        }
        toast({
          title: "Error",
          description: data.error || "Failed to upload products",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload products",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    setFile(null)
    setParsedProducts([])
    setValidationErrors([])
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bulk Upload Products</h2>
          <p className="text-muted-foreground">
            Upload multiple products at once using an Excel file.
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Instructions
          </CardTitle>
          <CardDescription>
            Follow these steps to upload products in bulk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Download the Excel template using the button below</li>
            <li>Fill in your product data following the template format</li>
            <li>
              Required columns: <Badge variant="outline">name</Badge>{" "}
              <Badge variant="outline">price</Badge>{" "}
              <Badge variant="outline">stock</Badge>
            </li>
            <li>
              Optional columns: <Badge variant="secondary">description</Badge>{" "}
              <Badge variant="secondary">category</Badge>{" "}
              <Badge variant="secondary">image</Badge>{" "}
              <Badge variant="secondary">featured</Badge>
            </li>
            <li>Upload the completed file and review the preview</li>
            <li>Click "Upload Products" to add them to your catalog</li>
          </ol>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </CardContent>
      </Card>

      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Select an Excel file (.xlsx, .xls) or CSV file to upload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />

          {!file ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Click to upload or drag and drop
              </h3>
              <p className="text-sm text-muted-foreground">
                Excel files (.xlsx, .xls) or CSV files supported
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearFile}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {uploadResult?.success && (
                <Alert className="border-green-500 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle>Upload Successful</AlertTitle>
                  <AlertDescription>
                    Successfully uploaded {uploadResult.count} products.{" "}
                    <Button
                      variant="link"
                      className="p-0 h-auto text-green-800"
                      onClick={() => router.push("/admin/products")}
                    >
                      View Products
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      {validationErrors.slice(0, 5).map((error, i) => (
                        <li key={i}>
                          Row {error.row}: {error.errors.join(", ")}
                        </li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>...and {validationErrors.length - 5} more errors</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Card */}
      {parsedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview ({parsedProducts.length} products)</span>
              <Button
                onClick={handleUpload}
                disabled={isUploading || validationErrors.length > 0 || uploadResult?.success}
              >
                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload Products
              </Button>
            </CardTitle>
            <CardDescription>
              Review the products before uploading. Rows with errors are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedProducts.slice(0, 50).map((product, index) => {
                    const rowNum = index + 2
                    const hasError = validationErrors.some(
                      (e) => e.row === rowNum
                    )

                    return (
                      <TableRow
                        key={index}
                        className={hasError ? "bg-destructive/10" : ""}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {product.name || (
                            <span className="text-destructive">Missing</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {product.description || "-"}
                        </TableCell>
                        <TableCell>
                          {product.price > 0 ? (
                            `$${product.price.toFixed(2)}`
                          ) : (
                            <span className="text-destructive">Invalid</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.stock >= 0 ? (
                            product.stock
                          ) : (
                            <span className="text-destructive">Invalid</span>
                          )}
                        </TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.featured ? (
                            <Badge className="bg-amber-100 text-amber-800">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasError ? (
                            <Badge variant="destructive">Error</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800">
                              Valid
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            {parsedProducts.length > 50 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing first 50 of {parsedProducts.length} products
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
