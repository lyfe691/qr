import type { DotType, CornerSquareType, CornerDotType } from "qr-code-styling"

export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H"

export interface QRConfig {
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

export const DEFAULT_CONFIG: QRConfig = {
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
