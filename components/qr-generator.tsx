"use client"

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react"
import type QRCodeStyling from "qr-code-styling"
import type {
  Options,
  DotType,
  CornerSquareType,
  CornerDotType,
  ShapeType,
} from "qr-code-styling"
import {
  Download,
  Copy,
  Check,
  Link,
  Type,
  ImagePlus,
  X,
  Palette,
  Shapes,
  Settings2,
  RotateCcw,
  Clock,
  Trash2,
  Circle,
  Square,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import {
  DEFAULT_CONFIG,
  PLACEHOLDER_DATA,
  isUrl as checkIsUrl,
  type QRConfig,
  type ErrorCorrectionLevel,
} from "@/lib/qr-config"
import { useQRHistory } from "@/hooks/use-qr-history"

// --- Constants ---

const DOT_STYLES: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
]

const CORNER_SQUARE_STYLES: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra Rounded" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
]

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy Rounded" },
  { value: "extra-rounded", label: "Extra Rounded" },
]

const SHAPE_OPTIONS: {
  value: ShapeType
  label: string
  icon: typeof Square
}[] = [
  { value: "square", label: "Square", icon: Square },
  { value: "circle", label: "Circle", icon: Circle },
]

const ERROR_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: "L", label: "Low (7%)" },
  { value: "M", label: "Medium (15%)" },
  { value: "Q", label: "Quartile (25%)" },
  { value: "H", label: "High (30%)" },
]

// --- Color Picker ---

function ColorInput({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (v: string) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-22 font-mono text-xs"
        />
        <label
          className="relative size-7 shrink-0 cursor-pointer rounded-md border shadow-xs"
          style={{ backgroundColor: value }}
        >
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  )
}

// --- Main Component ---

export function QRGenerator() {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG)
  const [copied, setCopied] = useState(false)
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    entries: historyEntries,
    save: historySave,
    remove: historyRemove,
    clear: historyClear,
  } = useQRHistory()

  const hasValue = config.data.trim().length > 0
  const isUrl = hasValue && checkIsUrl(config.data)

  const update = useCallback(
    <K extends keyof QRConfig>(key: K, value: QRConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Build qr-code-styling options from config
  const buildOptions = useCallback((cfg: QRConfig): Partial<Options> => {
    const rotationRad = (cfg.gradientRotation * Math.PI) / 180
    const fgGradient = cfg.useGradient
      ? {
          type: cfg.gradientType as "linear" | "radial",
          rotation: rotationRad,
          colorStops: [
            { offset: 0, color: cfg.gradientColor1 },
            { offset: 1, color: cfg.gradientColor2 },
          ],
        }
      : undefined

    const cornerColor = cfg.useCornerColor ? cfg.cornerColor : cfg.fgColor

    const bgRotationRad = (cfg.bgGradientRotation * Math.PI) / 180
    const bgGradient =
      !cfg.transparentBg && cfg.bgUseGradient
        ? {
            type: cfg.bgGradientType as "linear" | "radial",
            rotation: bgRotationRad,
            colorStops: [
              { offset: 0, color: cfg.bgGradientColor1 },
              { offset: 1, color: cfg.bgGradientColor2 },
            ],
          }
        : undefined

    return {
      data: cfg.data || PLACEHOLDER_DATA,
      width: cfg.size,
      height: cfg.size,
      margin: cfg.margin,
      type: "svg",
      shape: cfg.shape,
      dotsOptions: {
        type: cfg.dotStyle,
        color: cfg.fgColor,
        gradient: fgGradient,
      },
      cornersSquareOptions: {
        type: cfg.cornerSquareStyle,
        color: cornerColor,
      },
      cornersDotOptions: {
        type: cfg.cornerDotStyle,
        color: cornerColor,
      },
      backgroundOptions: {
        color: cfg.transparentBg ? "transparent" : cfg.bgColor,
        gradient: bgGradient,
      },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: 4,
        imageSize: cfg.logo ? cfg.logoSize : 0,
        hideBackgroundDots: !!cfg.logo,
      },
      image: cfg.logo ?? undefined,
      qrOptions: { errorCorrectionLevel: cfg.errorLevel },
    }
  }, [])

  // Load the library once
  const qrLibRef = useRef<typeof QRCodeStyling | null>(null)
  const [libReady, setLibReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    import("qr-code-styling").then((mod) => {
      if (cancelled) return
      qrLibRef.current = mod.default
      setLibReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Recreate instance on every config change (avoids deep-merge bugs in .update())
  useEffect(() => {
    const Lib = qrLibRef.current
    if (!Lib || !qrRef.current) return

    const instance = new Lib(buildOptions(config))
    qrRef.current.innerHTML = ""
    instance.append(qrRef.current)
    qrCodeRef.current = instance
    // eslint-disable-next-line react-hooks/exhaustive-deps -- buildOptions is stable (empty deps)
  }, [config, libReady])

  // --- Reset ---

  const resetConfig = useCallback(() => {
    setConfig((prev) => ({ ...DEFAULT_CONFIG, data: prev.data }))
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast.success("Reset to defaults")
  }, [])

  // --- Logo upload ---

  const loadLogoFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = () => {
      setConfig((prev) => ({
        ...prev,
        logo: reader.result as string,
        errorLevel: prev.errorLevel !== "H" ? "H" : prev.errorLevel,
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleLogoUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadLogoFile(file)
    },
    [loadLogoFile]
  )

  const handleLogoDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingLogo(true)
  }, [])

  const handleLogoDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingLogo(false)
  }, [])

  const handleLogoDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDraggingLogo(false)
      const file = e.dataTransfer.files?.[0]
      if (file) loadLogoFile(file)
    },
    [loadLogoFile]
  )

  const removeLogo = useCallback(() => {
    update("logo", null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [update])

  // --- Save to history (called on download/copy) ---

  const saveToHistory = useCallback(
    async (existingBlob?: Blob) => {
      if (!qrCodeRef.current || !hasValue) return
      let thumbnail: string | null = null
      try {
        const blob = existingBlob ?? (await qrCodeRef.current.getRawData("png"))
        if (blob) {
          thumbnail = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(blob as Blob)
          })
        }
      } catch {
        // Thumbnail is optional
      }
      historySave(config, thumbnail)
    },
    [config, hasValue, historySave]
  )

  // --- Download handlers ---

  const download = useCallback(
    async (extension: "png" | "svg" | "jpeg" | "webp") => {
      if (!qrCodeRef.current) return
      await qrCodeRef.current.download({ name: "qr-code", extension })
      toast.success(`${extension.toUpperCase()} downloaded`)
      saveToHistory()
    },
    [saveToHistory]
  )

  const copyToClipboard = useCallback(async () => {
    if (!qrCodeRef.current) return
    const blob = await qrCodeRef.current.getRawData("png")
    if (!blob) return
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob as Blob }),
    ])
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
    saveToHistory(blob as Blob)
  }, [saveToHistory])

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 md:py-16">
      {/* Title */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Create a QR Code
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Paste a link or type any text. Customize the style, then download.
        </p>
      </div>

      {/* Input */}
      <div className="mx-auto w-full max-w-md">
        <div className="relative">
          <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground">
            {isUrl ? <Link className="size-4" /> : <Type className="size-4" />}
          </div>
          <Input
            value={config.data}
            onChange={(e) => update("data", e.target.value)}
            placeholder="https://example.com"
            className="pl-9"
            autoFocus
          />
        </div>
      </div>

      {/* Main grid: Preview + Controls */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_340px]">
        {/* Preview */}
        <div className="flex flex-col items-center gap-6">
          <div
            className={cn(
              "flex items-center justify-center rounded-2xl border p-4 shadow-xs transition-all",
              config.transparentBg && "bg-checkerboard"
            )}
            style={{
              minWidth: 200,
              minHeight: 200,
              ...(!config.transparentBg && {
                backgroundColor: config.bgColor,
              }),
            }}
          >
            <div
              ref={qrRef}
              className={!hasValue ? "opacity-25" : "opacity-100"}
              style={{ transition: "opacity 0.2s ease" }}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => download("png")}
                  disabled={!hasValue}
                  size="sm"
                >
                  <Download className="size-3.5" />
                  PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Download as PNG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => download("svg")}
                  disabled={!hasValue}
                  size="sm"
                >
                  <Download className="size-3.5" />
                  SVG
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download as SVG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => download("jpeg")}
                  disabled={!hasValue}
                  size="sm"
                >
                  <Download className="size-3.5" />
                  JPEG
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download as JPEG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={() => download("webp")}
                  disabled={!hasValue}
                  size="sm"
                >
                  <Download className="size-3.5" />
                  WebP
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download as WebP</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={copyToClipboard}
                  disabled={!hasValue}
                  size="sm"
                >
                  {copied ? (
                    <Check className="size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  Copy
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                Copy image to clipboard
              </TooltipContent>
            </Tooltip>
          </div>

          {/* History */}
          {historyEntries.length > 0 && (
            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={() => setShowHistory((v) => !v)}
                className="flex w-full items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Clock className="size-3.5" />
                Recent ({historyEntries.length})
                <span className="ml-auto text-[10px]">
                  {showHistory ? "Hide" : "Show"}
                </span>
              </button>

              {showHistory && (
                <div className="mt-3 flex flex-col gap-2">
                  {historyEntries.map((entry) => (
                    <div
                      key={entry.timestamp}
                      className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent/50"
                    >
                      {entry.thumbnail && (
                        /* eslint-disable-next-line @next/next/no-img-element -- base64 thumbnail */
                        <img
                          src={entry.thumbnail}
                          alt=""
                          className="size-9 rounded border object-contain"
                        />
                      )}
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          setConfig({ ...DEFAULT_CONFIG, ...entry.config })
                        }
                      >
                        <p className="truncate text-sm">{entry.config.data}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </p>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0"
                        onClick={() => historyRemove(entry.timestamp)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={historyClear}
                  >
                    <Trash2 className="size-3" />
                    Clear history
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <Tabs defaultValue="style">
            <div className="flex items-center gap-2">
              <TabsList className="flex-1">
                <TabsTrigger value="style">
                  <Shapes className="size-3.5" />
                  Style
                </TabsTrigger>
                <TabsTrigger value="colors">
                  <Palette className="size-3.5" />
                  Colors
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings2 className="size-3.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0"
                    onClick={resetConfig}
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to defaults</TooltipContent>
              </Tooltip>
            </div>

            {/* Style Tab */}
            <TabsContent value="style" className="flex flex-col gap-5 pt-4">
              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">Shape</Label>
                <div className="flex gap-2">
                  {SHAPE_OPTIONS.map((s) => (
                    <Button
                      key={s.value}
                      variant={
                        config.shape === s.value ? "default" : "secondary"
                      }
                      size="sm"
                      className="flex-1"
                      onClick={() => update("shape", s.value)}
                    >
                      <s.icon className="size-3.5" />
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Dot Style
                </Label>
                <Select
                  value={config.dotStyle}
                  onValueChange={(v) => update("dotStyle", v as DotType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DOT_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Corner Square Style
                </Label>
                <Select
                  value={config.cornerSquareStyle}
                  onValueChange={(v) =>
                    update("cornerSquareStyle", v as CornerSquareType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CORNER_SQUARE_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Corner Dot Style
                </Label>
                <Select
                  value={config.cornerDotStyle}
                  onValueChange={(v) =>
                    update("cornerDotStyle", v as CornerDotType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {CORNER_DOT_STYLES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Logo Upload with Drag-and-Drop */}
              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Center Logo
                </Label>
                {config.logo ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded base64 data URL */}
                    <img
                      src={config.logo}
                      alt="Logo"
                      className="size-10 rounded-lg border object-contain"
                    />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Logo size
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {Math.round(config.logoSize * 100)}%
                        </span>
                      </div>
                      <Slider
                        value={[config.logoSize]}
                        onValueChange={([v]) => update("logoSize", v)}
                        min={0.2}
                        max={0.5}
                        step={0.05}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={removeLogo}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleLogoDragOver}
                    onDragLeave={handleLogoDragLeave}
                    onDrop={handleLogoDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
                      isDraggingLogo
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/20 hover:border-muted-foreground/40"
                    )}
                  >
                    <ImagePlus className="size-5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      Drop an image or click to upload
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  aria-label="Upload logo image"
                />
              </div>
            </TabsContent>

            {/* Colors Tab */}
            <TabsContent value="colors" className="flex flex-col gap-5 pt-4">
              <ColorInput
                value={config.fgColor}
                onChange={(v) => update("fgColor", v)}
                label="Foreground"
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Custom Corner Color
                </Label>
                <Switch
                  checked={config.useCornerColor}
                  onCheckedChange={(v) => update("useCornerColor", v)}
                  size="sm"
                />
              </div>

              {config.useCornerColor && (
                <ColorInput
                  value={config.cornerColor}
                  onChange={(v) => update("cornerColor", v)}
                  label="Corner Eyes"
                />
              )}

              <Separator />

              <ColorInput
                value={config.bgColor}
                onChange={(v) => update("bgColor", v)}
                label="Background"
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Transparent Background
                </Label>
                <Switch
                  checked={config.transparentBg}
                  onCheckedChange={(v) => update("transparentBg", v)}
                  size="sm"
                />
              </div>

              {!config.transparentBg && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Background Gradient
                    </Label>
                    <Switch
                      checked={config.bgUseGradient}
                      onCheckedChange={(v) => update("bgUseGradient", v)}
                      size="sm"
                    />
                  </div>

                  {config.bgUseGradient && (
                    <div className="flex flex-col gap-4">
                      <ColorInput
                        value={config.bgGradientColor1}
                        onChange={(v) => update("bgGradientColor1", v)}
                        label="BG Gradient Start"
                      />
                      <ColorInput
                        value={config.bgGradientColor2}
                        onChange={(v) => update("bgGradientColor2", v)}
                        label="BG Gradient End"
                      />
                      <div className="flex flex-col gap-2.5">
                        <Label className="text-xs text-muted-foreground">
                          BG Gradient Type
                        </Label>
                        <Select
                          value={config.bgGradientType}
                          onValueChange={(v) =>
                            update("bgGradientType", v as "linear" | "radial")
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="linear">Linear</SelectItem>
                              <SelectItem value="radial">Radial</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      {config.bgGradientType === "linear" && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs text-muted-foreground">
                              BG Angle
                            </Label>
                            <span className="font-mono text-xs text-muted-foreground">
                              {config.bgGradientRotation}°
                            </span>
                          </div>
                          <Slider
                            value={[config.bgGradientRotation]}
                            onValueChange={([v]) =>
                              update("bgGradientRotation", v)
                            }
                            min={0}
                            max={360}
                            step={15}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Gradient
                </Label>
                <Switch
                  checked={config.useGradient}
                  onCheckedChange={(v) => update("useGradient", v)}
                  size="sm"
                />
              </div>

              {config.useGradient && (
                <div className="flex flex-col gap-4">
                  <ColorInput
                    value={config.gradientColor1}
                    onChange={(v) => update("gradientColor1", v)}
                    label="Gradient Start"
                  />
                  <ColorInput
                    value={config.gradientColor2}
                    onChange={(v) => update("gradientColor2", v)}
                    label="Gradient End"
                  />
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-xs text-muted-foreground">
                      Gradient Type
                    </Label>
                    <Select
                      value={config.gradientType}
                      onValueChange={(v) =>
                        update("gradientType", v as "linear" | "radial")
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {config.gradientType === "linear" && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-muted-foreground">
                          Angle
                        </Label>
                        <span className="font-mono text-xs text-muted-foreground">
                          {config.gradientRotation}°
                        </span>
                      </div>
                      <Slider
                        value={[config.gradientRotation]}
                        onValueChange={([v]) => update("gradientRotation", v)}
                        min={0}
                        max={360}
                        step={15}
                      />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="flex flex-col gap-5 pt-4">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Size</Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {config.size}px
                  </span>
                </div>
                <Slider
                  value={[config.size]}
                  onValueChange={([v]) => update("size", v)}
                  min={128}
                  max={512}
                  step={16}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">
                    Margin
                  </Label>
                  <span className="font-mono text-xs text-muted-foreground">
                    {config.margin}px
                  </span>
                </div>
                <Slider
                  value={[config.margin]}
                  onValueChange={([v]) => update("margin", v)}
                  min={0}
                  max={40}
                  step={4}
                />
              </div>

              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Error Correction
                </Label>
                <Select
                  value={config.errorLevel}
                  onValueChange={(v) =>
                    update("errorLevel", v as ErrorCorrectionLevel)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {ERROR_LEVELS.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {config.logo && config.errorLevel !== "H" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Using a logo? High error correction is recommended.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
