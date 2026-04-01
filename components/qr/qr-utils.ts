import * as QRCode from "qrcode"

export type InputKind = "empty" | "url" | "email" | "phone" | "text"

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

export type QROptions = {
  size: number
  foreground: string
  background: string
  errorCorrectionLevel: ErrorCorrectionLevel
  includeMargin: boolean
}

export type ColorPreset = {
  id: string
  label: string
  foreground: string
  background: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[\d\s().-]{6,}$/
const URL_SCHEME_REGEX = /^[a-z][a-z\d+.-]*:\/\//i
const HOSTNAME_REGEX =
  /^(localhost(:\d+)?|([\w-]+\.)+[a-z]{2,})(\/.*)?$/i

export const DEFAULT_QR_OPTIONS: QROptions = {
  size: 320,
  foreground: "#111827",
  background: "#f9fafb",
  errorCorrectionLevel: "M",
  includeMargin: true,
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "ink",
    label: "Ink",
    foreground: "#111827",
    background: "#f9fafb",
  },
  {
    id: "midnight",
    label: "Midnight",
    foreground: "#0b1220",
    background: "#e2e8f0",
  },
  {
    id: "ocean",
    label: "Ocean",
    foreground: "#0c4a6e",
    background: "#ecfeff",
  },
  {
    id: "forest",
    label: "Forest",
    foreground: "#14532d",
    background: "#f0fdf4",
  },
  {
    id: "rose",
    label: "Rose",
    foreground: "#881337",
    background: "#fff1f2",
  },
  {
    id: "amber",
    label: "Amber",
    foreground: "#7c2d12",
    background: "#fffbeb",
  },
]

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value)
}

export function detectInputKind(value: string): InputKind {
  const trimmed = value.trim()

  if (!trimmed) {
    return "empty"
  }

  if (trimmed.startsWith("mailto:") || EMAIL_REGEX.test(trimmed)) {
    return "email"
  }

  if (trimmed.startsWith("tel:") || PHONE_REGEX.test(trimmed)) {
    return "phone"
  }

  if (URL_SCHEME_REGEX.test(trimmed) || HOSTNAME_REGEX.test(trimmed)) {
    return "url"
  }

  return "text"
}

export function normalizeInputValue(value: string, kind?: InputKind): string {
  const trimmed = value.trim()
  const resolvedKind = kind ?? detectInputKind(trimmed)

  if (!trimmed) {
    return ""
  }

  if (resolvedKind === "email") {
    return trimmed.startsWith("mailto:") ? trimmed : `mailto:${trimmed}`
  }

  if (resolvedKind === "phone") {
    if (trimmed.startsWith("tel:")) {
      return trimmed
    }

    const cleaned = trimmed.replace(/[^\d+]/g, "")
    return `tel:${cleaned}`
  }

  if (resolvedKind === "url") {
    if (URL_SCHEME_REGEX.test(trimmed)) {
      return trimmed
    }

    return `https://${trimmed}`
  }

  return trimmed
}

export function getInputKindLabel(kind: InputKind): string {
  if (kind === "url") return "URL"
  if (kind === "email") return "Email"
  if (kind === "phone") return "Phone"
  if (kind === "text") return "Text"
  return "None"
}

function getQrRenderOptions(options: QROptions) {
  return {
    width: options.size,
    margin: options.includeMargin ? 4 : 0,
    errorCorrectionLevel: options.errorCorrectionLevel,
    color: {
      dark: options.foreground,
      light: options.background,
    },
  } satisfies QRCode.QRCodeToDataURLOptions
}

export async function generateQrAssets(value: string, options: QROptions) {
  const renderOptions = getQrRenderOptions(options)

  const [pngDataUrl, svgMarkup] = await Promise.all([
    QRCode.toDataURL(value, renderOptions),
    QRCode.toString(value, {
      ...renderOptions,
      type: "svg",
    }),
  ])

  return { pngDataUrl, svgMarkup }
}

function getFilenameSeed(value: string, kind: InputKind): string {
  const sanitized = value
    .replace(/^https?:\/\//i, "")
    .replace(/^mailto:/i, "")
    .replace(/^tel:/i, "")
    .trim()

  const slug = sanitized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  if (slug) {
    return slug
  }

  return kind === "empty" ? "untitled" : "custom"
}

export function getAutoFilename(value: string, kind: InputKind): string {
  const seed = getFilenameSeed(value, kind)
  return `${seed}-qr`
}

export function injectLogoIntoSvg(svgMarkup: string, logoDataUrl: string): string {
  const logoSizeRatio = 0.22

  const viewBoxMatch = svgMarkup.match(/viewBox="([^\"]+)"/)
  const widthMatch = svgMarkup.match(/width="(\d+)"/)
  const sizeFromViewBox = viewBoxMatch?.[1]?.split(" ")?.[2]
  const baseSize = Number(sizeFromViewBox ?? widthMatch?.[1] ?? 320)
  const logoSize = Math.round(baseSize * logoSizeRatio)
  const logoPadding = Math.round(logoSize * 0.16)
  const logoX = Math.round((baseSize - logoSize) / 2)
  const logoY = Math.round((baseSize - logoSize) / 2)
  const innerSize = logoSize - logoPadding * 2
  const cornerRadius = Math.round(logoSize * 0.2)

  const logoMarkup = `
    <rect x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" rx="${cornerRadius}" fill="white" />
    <image href="${logoDataUrl}" x="${logoX + logoPadding}" y="${logoY + logoPadding}" width="${innerSize}" height="${innerSize}" preserveAspectRatio="xMidYMid meet" />
  `

  return svgMarkup.replace("</svg>", `${logoMarkup}</svg>`)
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Could not load image."))
    image.src = src
  })
}

export async function composePngWithLogo(
  qrPngDataUrl: string,
  logoDataUrl: string,
  exportSize: number
) {
  const [qrImage, logoImage] = await Promise.all([
    loadImage(qrPngDataUrl),
    loadImage(logoDataUrl),
  ])

  const canvas = document.createElement("canvas")
  canvas.width = exportSize
  canvas.height = exportSize

  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not initialize canvas.")
  }

  context.drawImage(qrImage, 0, 0, exportSize, exportSize)

  const boxSize = Math.round(exportSize * 0.22)
  const boxX = Math.round((exportSize - boxSize) / 2)
  const boxY = Math.round((exportSize - boxSize) / 2)
  const boxPadding = Math.round(boxSize * 0.16)
  const innerSize = boxSize - boxPadding * 2

  context.fillStyle = "#ffffff"
  roundedRect(context, boxX, boxY, boxSize, boxSize, Math.round(boxSize * 0.2))
  context.fill()

  context.drawImage(
    logoImage,
    boxX + boxPadding,
    boxY + boxPadding,
    innerSize,
    innerSize
  )

  return canvas.toDataURL("image/png")
}

export function downloadData(data: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = href
  anchor.download = filename
  anchor.click()

  URL.revokeObjectURL(href)
}

export function getDownloadSize(selectedSize: number) {
  return Math.min(Math.max(selectedSize * 2, 512), 2048)
}
