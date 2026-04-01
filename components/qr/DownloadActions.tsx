import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { DownloadIcon, FileImageIcon, FileTypeIcon } from "lucide-react"

export type DownloadFormat = "png" | "svg"

type DownloadActionsProps = {
  canDownload: boolean
  filename: string
  format: DownloadFormat
  isDownloading: boolean
  onFormatChange: (format: DownloadFormat) => void
  onDownload: () => void
}

export function DownloadActions({
  canDownload,
  filename,
  format,
  isDownloading,
  onFormatChange,
  onDownload,
}: DownloadActionsProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Export</h3>
        <span className="text-xs text-slate-700">{filename}</span>
      </div>

      <div className="space-y-2">
        <Tabs
          value={format}
          onValueChange={(value) => onFormatChange(value as DownloadFormat)}
          className="w-full"
        >
          <TabsList className="grid h-10 w-full grid-cols-2 rounded-2xl bg-white p-1">
            <TabsTrigger value="png" className="rounded-xl">
              <FileImageIcon className="size-4" />
              PNG
            </TabsTrigger>
            <TabsTrigger value="svg" className="rounded-xl">
              <FileTypeIcon className="size-4" />
              SVG
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          type="button"
          onClick={onDownload}
          disabled={!canDownload || isDownloading}
          className="h-10 w-full"
        >
          {isDownloading ? <Spinner className="size-4" /> : <DownloadIcon className="size-4" />}
          {isDownloading
            ? "Preparing file..."
            : `Download ${format.toUpperCase()}`}
        </Button>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-slate-700">
        <DownloadIcon className="size-3.5" />
        Retina-ready export up to 2048px.
      </p>
    </section>
  )
}
