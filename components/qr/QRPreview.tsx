import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { QrCodeIcon } from "lucide-react"
import Image from "next/image"

import { getInputKindLabel, type InputKind } from "./qr-utils"

type QRPreviewProps = {
  previewPngDataUrl: string | null
  normalizedValue: string
  detectedKind: InputKind
  size: number
  isGenerating: boolean
  logoDataUrl: string | null
}

export function QRPreview({
  previewPngDataUrl,
  normalizedValue,
  detectedKind,
  size,
  isGenerating,
  logoDataUrl,
}: QRPreviewProps) {
  const hasValue = Boolean(normalizedValue)
  const badgeLabel = getInputKindLabel(detectedKind)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Preview</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{size}px</Badge>
          <Badge variant="secondary">{badgeLabel}</Badge>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_25%_20%,rgba(14,116,144,0.1),transparent_45%),radial-gradient(circle_at_80%_75%,rgba(251,146,60,0.15),transparent_50%),linear-gradient(135deg,rgba(255,255,255,1),rgba(244,244,245,0.92))] p-5 shadow-sm">
        <div className="flex min-h-80 items-center justify-center">
          {!hasValue ? (
            <div className="flex max-w-xs flex-col items-center text-center text-slate-700">
              <div className="mb-3 rounded-2xl bg-white p-3 shadow-xs">
                <QrCodeIcon className="size-8" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Enter a URL to generate your QR code.
              </p>
              <p className="mt-1 text-xs">
                You can also use plain text, email, or phone number.
              </p>
            </div>
          ) : null}

          {hasValue && isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-slate-700">
              <Spinner className="size-6" />
              <p className="text-sm">Rendering preview...</p>
            </div>
          ) : null}

          {hasValue && !isGenerating && previewPngDataUrl ? (
            <div className="relative rounded-2xl bg-white p-3 shadow-md ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-300">
              <Image
                src={previewPngDataUrl}
                alt="Generated QR code"
                width={size}
                height={size}
                unoptimized
                className="mx-auto h-auto w-full max-w-[20rem]"
              />

              {logoDataUrl ? (
                <Image
                  src={logoDataUrl}
                  alt="Logo overlay"
                  width={64}
                  height={64}
                  unoptimized
                  className="pointer-events-none absolute top-1/2 left-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white bg-white p-1.5 shadow"
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <p className="break-all text-xs text-slate-700">
        Encoded value: {normalizedValue || "Waiting for input"}
      </p>
    </section>
  )
}
