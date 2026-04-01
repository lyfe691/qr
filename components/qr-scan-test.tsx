"use client"

import { useState, useRef, useCallback } from "react"
import {
  ScanLine,
  Upload,
  ExternalLink,
  X,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ScanResult {
  data: string
  isUrl: boolean
}

export function QRScanTest() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const scanImage = useCallback(async (file: File) => {
    setResult(null)
    setError(null)

    try {
      const QrScanner = (await import("qr-scanner")).default
      const scanResult = await QrScanner.scanImage(file, {
        returnDetailedScanResult: true,
      })
      const data = scanResult.data
      const isUrl = /^https?:\/\/.+/i.test(data)
      setResult({ data, isUrl })
    } catch {
      setError("No QR code found in this image.")
    }
  }, [])

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file?.type.startsWith("image/")) return
      void scanImage(file)
    },
    [scanImage]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      handleFile(e.dataTransfer.files?.[0])
    },
    [handleFile]
  )

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        <ScanLine className="size-3.5" />
        Scan Test
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogTitle>Scan Test</DialogTitle>
          <DialogDescription>
            Upload a QR code image to verify it scans correctly.
          </DialogDescription>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/20 hover:border-muted-foreground/40"
            )}
          >
            <Upload className="size-6 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Drop an image here or click to upload
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG, SVG, or WebP
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="hidden"
          />

          {result && (
            <div className="flex items-start gap-3 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/20">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  QR code decoded
                </p>
                {result.isUrl ? (
                  <a
                    href={result.data}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm break-all text-emerald-700 underline dark:text-emerald-300"
                  >
                    {result.data}
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                ) : (
                  <p className="mt-1 text-sm break-all text-emerald-700 dark:text-emerald-300">
                    {result.data}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={reset}
              >
                <X className="size-3" />
              </Button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-lg border bg-red-50 p-3 dark:bg-red-950/20">
              <XCircle className="mt-0.5 size-4 shrink-0 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
