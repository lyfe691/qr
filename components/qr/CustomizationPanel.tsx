import { ChangeEvent } from "react"
import { ImagePlusIcon, RotateCcwIcon, XIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  FieldDescription,
  FieldLabel,
  FieldSeparator,
  FieldTitle,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import {
  COLOR_PRESETS,
  type ColorPreset,
  type ErrorCorrectionLevel,
  type QROptions,
} from "./qr-utils"

type CustomizationPanelProps = {
  options: QROptions
  logoDataUrl: string | null
  onOptionsChange: (next: Partial<QROptions>) => void
  onApplyPreset: (preset: ColorPreset) => void
  onResetStyle: () => void
  onUploadLogo: (file: File | null) => void
  onRemoveLogo: () => void
}

const errorLevels: Array<{
  value: ErrorCorrectionLevel
  label: string
  help: string
}> = [
  { value: "L", label: "L - Low", help: "Small data overhead" },
  { value: "M", label: "M - Medium", help: "Balanced reliability" },
  { value: "Q", label: "Q - Quartile", help: "Safer with mild damage" },
  { value: "H", label: "H - High", help: "Best for logo overlays" },
]

function ColorControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-transparent p-1"
          aria-label={label}
        />
        <Input
          value={value.toUpperCase()}
          className="font-mono text-xs"
          readOnly
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  )
}

export function CustomizationPanel({
  options,
  logoDataUrl,
  onOptionsChange,
  onApplyPreset,
  onResetStyle,
  onUploadLogo,
  onRemoveLogo,
}: CustomizationPanelProps) {
  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    onUploadLogo(event.target.files?.[0] ?? null)
  }

  const activePresetId =
    COLOR_PRESETS.find(
      (preset) =>
        preset.foreground === options.foreground &&
        preset.background === options.background
    )?.id ?? null

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <FieldTitle>Customize</FieldTitle>
        <Button type="button" variant="ghost" size="sm" onClick={onResetStyle}>
          <RotateCcwIcon className="size-4" />
          Reset style
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Color presets</FieldLabel>
          <span className="text-xs text-slate-700">One-tap themes</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COLOR_PRESETS.map((preset) => {
            const isActive = preset.id === activePresetId

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyPreset(preset)}
                className="group flex items-center justify-between rounded-2xl border px-2.5 py-2 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-sm"
                style={{
                  borderColor: isActive ? preset.foreground : "var(--border)",
                  backgroundColor: isActive ? `${preset.background}E6` : "#ffffff99",
                }}
              >
                <span className="text-xs font-medium text-slate-700">
                  {preset.label}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="size-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: preset.foreground }}
                  />
                  <span
                    className="size-3 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: preset.background }}
                  />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="size-slider">Size</FieldLabel>
          <span className="text-xs text-slate-700">{options.size}px</span>
        </div>
        <Slider
          id="size-slider"
          min={128}
          max={1024}
          step={8}
          value={[options.size]}
          onValueChange={(values) =>
            onOptionsChange({ size: values[0] ?? options.size })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ColorControl
          id="foreground-color"
          label="Foreground"
          value={options.foreground}
          onChange={(value) => onOptionsChange({ foreground: value })}
        />
        <ColorControl
          id="background-color"
          label="Background"
          value={options.background}
          onChange={(value) => onOptionsChange({ background: value })}
        />
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="error-correction">Error correction</FieldLabel>
        <Select
          value={options.errorCorrectionLevel}
          onValueChange={(value) =>
            onOptionsChange({
              errorCorrectionLevel: value as ErrorCorrectionLevel,
            })
          }
        >
          <SelectTrigger id="error-correction" className="w-full bg-white">
            <SelectValue placeholder="Choose level" />
          </SelectTrigger>
          <SelectContent>
            {errorLevels.map((level) => (
              <SelectItem key={level.value} value={level.value}>
                {level.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldDescription className="text-slate-700">
          {
            errorLevels.find((level) => level.value === options.errorCorrectionLevel)
              ?.help
          }
        </FieldDescription>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <div className="space-y-0.5">
          <FieldLabel htmlFor="margin-toggle">Quiet zone margin</FieldLabel>
          <FieldDescription className="text-slate-700">
            Improves scanner reliability
          </FieldDescription>
        </div>
        <Switch
          id="margin-toggle"
          checked={options.includeMargin}
          onCheckedChange={(checked) => onOptionsChange({ includeMargin: checked })}
        />
      </div>

      <FieldSeparator />

      <div className="space-y-3">
        <FieldLabel htmlFor="logo-upload">Center logo (optional)</FieldLabel>
        <label
          htmlFor="logo-upload"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50"
        >
          <ImagePlusIcon className="size-4" />
          Upload logo
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleLogoUpload}
        />

        {logoDataUrl ? (
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex items-center gap-3">
              <Image
                src={logoDataUrl}
                alt="Uploaded logo"
                width={32}
                height={32}
                unoptimized
                className="size-8 rounded-lg object-cover"
              />
              <span className="text-xs text-slate-700">Logo ready</span>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onRemoveLogo}>
              <XIcon className="size-4" />
              Remove
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
