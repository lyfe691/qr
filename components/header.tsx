"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Kbd } from "@/components/ui/kbd"
import { QRScanTest } from "@/components/qr-scan-test"

export function Header() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <QrCode className="size-4" strokeWidth={2.5} />
        </div>
        <span className="text-sm font-semibold tracking-tight">QR</span>
      </div>

      <div className="flex items-center gap-1">
        <QRScanTest />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <Sun className="size-4 scale-100 rotate-0 transition-transform dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute size-4 scale-0 rotate-90 transition-transform dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Toggle theme <Kbd>D</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
