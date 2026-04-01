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

// --- Types ---

type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

interface QRConfig {
  data: string
  size: number
  errorLevel: ErrorCorrectionLevel
  dotStyle: DotType
  cornerSquareStyle: CornerSquareType
  cornerDotStyle: CornerDotType
  fgColor: string
  bgColor: string
  useGradient: boolean
  gradientColor1: string
  gradientColor2: string
  gradientType: "linear" | "radial"
  logo: string | null
  logoSize: number
  margin: number
}

const DEFAULT_CONFIG: QRConfig = {
  data: "",
  size: 300,
  errorLevel: "Q",
  dotStyle: "rounded",
  cornerSquareStyle: "extra-rounded",
  cornerDotStyle: "dot",
  fgColor: "#1a1a2e",
  bgColor: "#ffffff",
  useGradient: false,
  gradientColor1: "#1a1a2e",
  gradientColor2: "#6c5ce7",
  gradientType: "linear",
  logo: null,
  logoSize: 0.35,
  margin: 12,
}

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
  { value: "extra-rounded", label: "Rounded" },
]

const CORNER_DOT_STYLES: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
]

const ERROR_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: "L", label: "Low (7%)" },
  { value: "M", label: "Medium (15%)" },
  { value: "Q", label: "Quartile (25%)" },
  { value: "H", label: "High (30%)" },
]

// --- Color Swatch ---

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
    <div className="flex items-center gap-3">
      <label className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div
          className="size-8 rounded-lg border shadow-xs transition-colors"
          style={{ backgroundColor: value }}
        />
      </label>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-24 font-mono text-xs"
        />
      </div>
    </div>
  )
}

// --- Main Component ---

export function QRGenerator() {
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG)
  const [copied, setCopied] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeRef = useRef<QRCodeStyling | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const hasValue = config.data.trim().length > 0
  const isUrl = hasValue && /^https?:\/\/.+/i.test(config.data.trim())

  const update = useCallback(
    <K extends keyof QRConfig>(key: K, value: QRConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  // Build qr-code-styling options from config
  const buildOptions = useCallback((cfg: QRConfig): Partial<Options> => {
    const dotsOptions: Options["dotsOptions"] = cfg.useGradient
      ? {
          type: cfg.dotStyle,
          gradient: {
            type: cfg.gradientType,
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: cfg.gradientColor1 },
              { offset: 1, color: cfg.gradientColor2 },
            ],
          },
        }
      : { type: cfg.dotStyle, color: cfg.fgColor }

    return {
      data: cfg.data || "https://example.com",
      width: cfg.size,
      height: cfg.size,
      margin: cfg.margin,
      type: "svg",
      dotsOptions,
      cornersSquareOptions: {
        type: cfg.cornerSquareStyle,
        color: cfg.useGradient ? cfg.gradientColor1 : cfg.fgColor,
      },
      cornersDotOptions: {
        type: cfg.cornerDotStyle,
        color: cfg.useGradient ? cfg.gradientColor2 : cfg.fgColor,
      },
      backgroundOptions: { color: cfg.bgColor },
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

  // Initialize QR code instance
  useEffect(() => {
    let cancelled = false

    async function init() {
      const QRCodeStylingLib = (await import("qr-code-styling")).default
      if (cancelled) return

      const instance = new QRCodeStylingLib(buildOptions(config))
      qrCodeRef.current = instance

      if (qrRef.current) {
        qrRef.current.innerHTML = ""
        instance.append(qrRef.current)
      }
    }

    init()
    return () => {
      cancelled = true
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update QR code when config changes
  useEffect(() => {
    if (!qrCodeRef.current) return
    qrCodeRef.current.update(buildOptions(config))
  }, [config, buildOptions])

  // Logo upload handler
  const handleLogoUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = () => {
        update("logo", reader.result as string)
        // When adding a logo, bump error correction to H for reliability
        if (config.errorLevel !== "H") {
          update("errorLevel", "H")
        }
      }
      reader.readAsDataURL(file)
    },
    [update, config.errorLevel]
  )

  const removeLogo = useCallback(() => {
    update("logo", null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [update])

  // Download handlers
  const downloadPNG = useCallback(async () => {
    if (!qrCodeRef.current) return
    await qrCodeRef.current.download({
      name: "qr-code",
      extension: "png",
    })
    toast.success("PNG downloaded")
  }, [])

  const downloadSVG = useCallback(async () => {
    if (!qrCodeRef.current) return
    await qrCodeRef.current.download({
      name: "qr-code",
      extension: "svg",
    })
    toast.success("SVG downloaded")
  }, [])

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
  }, [])

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
            className="flex items-center justify-center rounded-2xl border bg-white p-4 shadow-xs transition-all"
            style={{ minWidth: 200, minHeight: 200 }}
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
                <Button onClick={downloadPNG} disabled={!hasValue} size="sm">
                  <Download className="size-3.5" />
                  PNG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as PNG</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={downloadSVG}
                  disabled={!hasValue}
                  size="sm"
                >
                  <Download className="size-3.5" />
                  SVG
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download as SVG</TooltipContent>
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
              <TooltipContent>Copy image to clipboard</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="rounded-2xl border bg-card p-4 shadow-xs">
          <Tabs defaultValue="style">
            <TabsList className="w-full">
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

            {/* Style Tab */}
            <TabsContent value="style" className="flex flex-col gap-5 pt-4">
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

              {/* Logo Upload */}
              <div className="flex flex-col gap-2.5">
                <Label className="text-xs text-muted-foreground">
                  Center Logo
                </Label>
                {config.logo ? (
                  <div className="flex items-center gap-3">
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
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlus className="size-4" />
                    Upload Logo
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
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
              <ColorInput
                value={config.bgColor}
                onChange={(v) => update("bgColor", v)}
                label="Background"
              />

              <Separator />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">
                  Use Gradient
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
