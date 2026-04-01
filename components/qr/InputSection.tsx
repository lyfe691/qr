import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { CopyIcon, XIcon } from "lucide-react"

import { getInputKindLabel, type InputKind } from "./qr-utils"

type InputSectionProps = {
  inputValue: string
  normalizedValue: string
  detectedKind: InputKind
  errorMessage: string | null
  isCopied: boolean
  onInputChange: (value: string) => void
  onCopy: () => void
  onClearAll: () => void
}

export function InputSection({
  inputValue,
  normalizedValue,
  detectedKind,
  errorMessage,
  isCopied,
  onInputChange,
  onCopy,
  onClearAll,
}: InputSectionProps) {
  const kindLabel = getInputKindLabel(detectedKind)
  const trimmedInput = inputValue.trim()
  const showsFormattedHint = Boolean(
    trimmedInput && normalizedValue && trimmedInput !== normalizedValue
  )

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor="qr-input">Your content</FieldLabel>
        <Badge variant="secondary">Detected: {kindLabel}</Badge>
      </div>

      <FieldDescription className="text-slate-700">
        Paste any text, URL, email, or phone number. Formatting is applied
        automatically.
      </FieldDescription>

      <Textarea
        id="qr-input"
        name="qr-input"
        placeholder="example.com, hello world, hello@domain.com, +1 555 222 1111"
        aria-invalid={Boolean(errorMessage)}
        value={inputValue}
        onChange={(event) => onInputChange(event.target.value)}
        className="min-h-28 bg-white shadow-xs transition duration-200 focus-visible:bg-white"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
        <span>{inputValue.trim().length} characters</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopy}
            disabled={!inputValue.trim()}
          >
            <CopyIcon className="size-4" />
            {isCopied ? "Copied" : "Copy input"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            disabled={!inputValue.trim()}
          >
            <XIcon className="size-4" />
            Clear all
          </Button>
        </div>
      </div>

      {showsFormattedHint ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
          Encodes as: <span className="font-mono text-[11px]">{normalizedValue}</span>
        </div>
      ) : null}

      <FieldError>{errorMessage}</FieldError>
    </section>
  )
}
