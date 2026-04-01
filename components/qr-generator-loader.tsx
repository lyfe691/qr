"use client"

import dynamic from "next/dynamic"

const QRGenerator = dynamic(
  () =>
    import("@/components/qr-generator").then((mod) => ({
      default: mod.QRGenerator,
    })),
  { ssr: false }
)

export function QRGeneratorLoader() {
  return <QRGenerator />
}
