import type {
  DotType,
  CornerSquareType,
  CornerDotType,
  ShapeType,
} from "qr-code-styling"

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

export interface QRConfig {
  data: string
  size: number
  errorLevel: ErrorCorrectionLevel
  shape: ShapeType
  dotStyle: DotType
  cornerSquareStyle: CornerSquareType
  cornerDotStyle: CornerDotType
  fgColor: string
  bgColor: string
  transparentBg: boolean
  cornerColor: string
  useCornerColor: boolean
  useGradient: boolean
  gradientColor1: string
  gradientColor2: string
  gradientType: "linear" | "radial"
  gradientRotation: number
  bgUseGradient: boolean
  bgGradientColor1: string
  bgGradientColor2: string
  bgGradientType: "linear" | "radial"
  bgGradientRotation: number
  logo: string | null
  logoSize: number
  margin: number
}

export const PLACEHOLDER_DATA = "https://example.com"

export function isUrl(text: string): boolean {
  return /^https?:\/\/.+/i.test(text.trim())
}

export const DEFAULT_CONFIG: QRConfig = {
  data: "",
  size: 300,
  errorLevel: "Q",
  shape: "square",
  dotStyle: "rounded",
  cornerSquareStyle: "extra-rounded",
  cornerDotStyle: "dot",
  fgColor: "#1a1a2e",
  bgColor: "#ffffff",
  transparentBg: false,
  cornerColor: "#1a1a2e",
  useCornerColor: false,
  useGradient: false,
  gradientColor1: "#1a1a2e",
  gradientColor2: "#6c5ce7",
  gradientType: "linear",
  gradientRotation: 45,
  bgUseGradient: false,
  bgGradientColor1: "#ffffff",
  bgGradientColor2: "#e0e0ff",
  bgGradientType: "linear",
  bgGradientRotation: 45,
  logo: null,
  logoSize: 0.35,
  margin: 12,
}
