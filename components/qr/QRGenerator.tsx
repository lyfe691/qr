"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import { SparklesIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { CustomizationPanel } from "./CustomizationPanel"
import { DownloadActions, type DownloadFormat } from "./DownloadActions"
import { InputSection } from "./InputSection"
import { QRPreview } from "./QRPreview"
import {
  composePngWithLogo,
  DEFAULT_QR_OPTIONS,
  detectInputKind,
  downloadData,
  generateQrAssets,
  getAutoFilename,
  getDownloadSize,
  injectLogoIntoSvg,
  isHexColor,
  normalizeInputValue,
  type QROptions,
} from "./qr-utils"

const STORAGE_KEY = "qr-generator-state-v1"

type PersistedState = {
  inputValue: string
  options: QROptions
}

function clampSize(value: number) {
  return Math.min(Math.max(Math.round(value), 128), 1024)
}

function normalizeOptions(input: Partial<QROptions> | null | undefined): QROptions {
  return {
    size: clampSize(input?.size ?? DEFAULT_QR_OPTIONS.size),
    foreground:
      typeof input?.foreground === "string" && isHexColor(input.foreground)
        ? input.foreground
        : DEFAULT_QR_OPTIONS.foreground,
    background:
      typeof input?.background === "string" && isHexColor(input.background)
        ? input.background
        : DEFAULT_QR_OPTIONS.background,
    errorCorrectionLevel:
      input?.errorCorrectionLevel === "L" ||
      input?.errorCorrectionLevel === "M" ||
      input?.errorCorrectionLevel === "Q" ||
      input?.errorCorrectionLevel === "H"
        ? input.errorCorrectionLevel
        : DEFAULT_QR_OPTIONS.errorCorrectionLevel,
    includeMargin:
      typeof input?.includeMargin === "boolean"
        ? input.includeMargin
        : DEFAULT_QR_OPTIONS.includeMargin,
  }
}

function downloadDataUrl(href: string, filename: string) {
  const anchor = document.createElement("a")
  anchor.href = href
  anchor.download = filename
  anchor.click()
}

export function QRGenerator() {
  const [inputValue, setInputValue] = useState("")
  const [options, setOptions] = useState<QROptions>(DEFAULT_QR_OPTIONS)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)

  const [previewPngDataUrl, setPreviewPngDataUrl] = useState<string | null>(null)
  const [previewSvgMarkup, setPreviewSvgMarkup] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>("png")
  const [generationError, setGenerationError] = useState<string | null>(null)

  const [hasInteracted, setHasInteracted] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const copyTimer = useRef<number | null>(null)
  const qrCacheRef = useRef<Map<string, { pngDataUrl: string; svgMarkup: string }>>(
    new Map()
  )

  const detectedKind = useMemo(() => detectInputKind(inputValue), [inputValue])
  const normalizedValue = useMemo(
    () => normalizeInputValue(inputValue, detectedKind),
    [inputValue, detectedKind]
  )
  const deferredNormalizedValue = useDeferredValue(normalizedValue)

  const qrOptionsKey = useMemo(
    () =>
      [
        options.size,
        options.foreground,
        options.background,
        options.errorCorrectionLevel,
        options.includeMargin ? 1 : 0,
      ].join("|"),
    [
      options.size,
      options.foreground,
      options.background,
      options.errorCorrectionLevel,
      options.includeMargin,
    ]
  )

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)

      if (!stored) {
        return
      }

      const parsed = JSON.parse(stored) as Partial<PersistedState>

      if (typeof parsed.inputValue === "string") {
        setInputValue(parsed.inputValue)
      }

      setOptions(normalizeOptions(parsed.options))
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    const payload: PersistedState = {
      inputValue,
      options,
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [inputValue, options])

  useEffect(
    () => () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current)
      }
    },
    []
  )

  useEffect(() => {
    if (!deferredNormalizedValue) {
      setPreviewPngDataUrl(null)
      setPreviewSvgMarkup(null)
      setGenerationError(null)
      setIsGenerating(false)
      return
    }

    const cacheKey = `${deferredNormalizedValue}::${qrOptionsKey}`
    const cached = qrCacheRef.current.get(cacheKey)

    if (cached) {
      setPreviewPngDataUrl(cached.pngDataUrl)
      setPreviewSvgMarkup(cached.svgMarkup)
      setGenerationError(null)
      setIsGenerating(false)
      return
    }

    let isCurrent = true

    setIsGenerating(true)
    setGenerationError(null)

    generateQrAssets(deferredNormalizedValue, options)
      .then(({ pngDataUrl, svgMarkup }) => {
        if (!isCurrent) {
          return
        }

        qrCacheRef.current.set(cacheKey, { pngDataUrl, svgMarkup })

        if (qrCacheRef.current.size > 40) {
          const oldestKey = qrCacheRef.current.keys().next()
          if (!oldestKey.done) {
            qrCacheRef.current.delete(oldestKey.value)
          }
        }

        setPreviewPngDataUrl(pngDataUrl)
        setPreviewSvgMarkup(svgMarkup)
      })
      .catch(() => {
        if (!isCurrent) {
          return
        }

        setPreviewPngDataUrl(null)
        setPreviewSvgMarkup(null)
        setGenerationError("Unable to generate QR code. Please adjust your input.")
      })
      .finally(() => {
        if (isCurrent) {
          setIsGenerating(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [deferredNormalizedValue, options, qrOptionsKey])

  const inputErrorMessage =
    !normalizedValue && hasInteracted
      ? "Please enter some text, URL, email, or phone number."
      : generationError

  const filenameBase = useMemo(
    () => getAutoFilename(normalizedValue || inputValue, detectedKind),
    [detectedKind, inputValue, normalizedValue]
  )

  const updateOptions = (next: Partial<QROptions>) => {
    setOptions((previous) => {
      const merged = {
        ...previous,
        ...next,
      }

      return normalizeOptions(merged)
    })
  }

  const handleCopyInput = async () => {
    const text = inputValue.trim()

    if (!text) {
      setHasInteracted(true)
      return
    }

    try {
      await navigator.clipboard.writeText(inputValue)
      setIsCopied(true)

      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current)
      }

      copyTimer.current = window.setTimeout(() => {
        setIsCopied(false)
      }, 1400)
    } catch {
      setGenerationError("Copy failed. You can still copy manually.")
    }
  }

  const handleClearAll = () => {
    setInputValue("")
    setOptions(DEFAULT_QR_OPTIONS)
    setLogoDataUrl(null)
    setDownloadFormat("png")
    setHasInteracted(false)
    setGenerationError(null)
    setIsCopied(false)
    setPreviewPngDataUrl(null)
    setPreviewSvgMarkup(null)
    qrCacheRef.current.clear()
    window.localStorage.removeItem(STORAGE_KEY)
  }

  const handleUploadLogo = (file: File | null) => {
    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === "string") {
        setLogoDataUrl(reader.result)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleDownloadPng = async () => {
    if (!normalizedValue) {
      setHasInteracted(true)
      return
    }

    setIsDownloading(true)

    try {
      const exportSize = getDownloadSize(options.size)
      const { pngDataUrl } = await generateQrAssets(normalizedValue, {
        ...options,
        size: exportSize,
      })

      const finalPng = logoDataUrl
        ? await composePngWithLogo(pngDataUrl, logoDataUrl, exportSize)
        : pngDataUrl

      downloadDataUrl(finalPng, `${filenameBase}.png`)
    } catch {
      setGenerationError("PNG export failed. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadSvg = async () => {
    if (!normalizedValue) {
      setHasInteracted(true)
      return
    }

    setIsDownloading(true)

    try {
      const exportSize = getDownloadSize(options.size)
      const { svgMarkup } = await generateQrAssets(normalizedValue, {
        ...options,
        size: exportSize,
      })

      const finalSvg = logoDataUrl
        ? injectLogoIntoSvg(svgMarkup, logoDataUrl)
        : svgMarkup

      downloadData(finalSvg, `${filenameBase}.svg`, "image/svg+xml;charset=utf-8")
    } catch {
      setGenerationError("SVG export failed. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadSelected = () => {
    if (downloadFormat === "png") {
      void handleDownloadPng()
      return
    }

    void handleDownloadSvg()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border border-slate-200 bg-white/95 py-0 shadow-xl">
        <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-orange-50 px-5 py-5 sm:px-6">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-sky-200/60 bg-white px-3 py-1 text-xs text-sky-900">
            <SparklesIcon className="size-3.5" />
            Real-time generator
          </div>
          <CardTitle className="text-xl">Build your QR in seconds</CardTitle>
          <CardDescription className="text-slate-700">
            Live preview, robust scanning defaults, and high-quality exports.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-7 px-5 py-5 sm:px-6">
          <InputSection
            inputValue={inputValue}
            normalizedValue={normalizedValue}
            detectedKind={detectedKind}
            errorMessage={inputErrorMessage}
            isCopied={isCopied}
            onInputChange={(value) => {
              setInputValue(value)
              setHasInteracted(true)
            }}
            onCopy={handleCopyInput}
            onClearAll={handleClearAll}
          />

          <CustomizationPanel
            options={options}
            logoDataUrl={logoDataUrl}
            onOptionsChange={updateOptions}
            onApplyPreset={(preset) =>
              updateOptions({
                foreground: preset.foreground,
                background: preset.background,
              })
            }
            onResetStyle={() => {
              setOptions(DEFAULT_QR_OPTIONS)
              setLogoDataUrl(null)
            }}
            onUploadLogo={handleUploadLogo}
            onRemoveLogo={() => setLogoDataUrl(null)}
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border border-slate-200 bg-white/95 py-0 shadow-lg">
          <CardContent className="px-5 py-5 sm:px-6">
            <QRPreview
              previewPngDataUrl={previewPngDataUrl}
              normalizedValue={normalizedValue}
              detectedKind={detectedKind}
              size={options.size}
              isGenerating={isGenerating}
              logoDataUrl={logoDataUrl}
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white/95 py-0 shadow-lg">
          <CardContent className="px-5 py-5 sm:px-6">
            <DownloadActions
              canDownload={Boolean(previewPngDataUrl && previewSvgMarkup)}
              filename={filenameBase}
              format={downloadFormat}
              isDownloading={isDownloading}
              onFormatChange={setDownloadFormat}
              onDownload={handleDownloadSelected}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
