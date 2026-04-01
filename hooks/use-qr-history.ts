import { useState, useEffect, useCallback } from "react"
import type { QRConfig } from "@/lib/qr-config"

const STORAGE_KEY = "qr-history"
const MAX_ENTRIES = 10

export interface QRHistoryEntry {
  config: QRConfig
  timestamp: number
  thumbnail: string | null
}

function loadEntries(): QRHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function persistEntries(entries: QRHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Ignore quota errors
  }
}

export function useQRHistory() {
  const [entries, setEntries] = useState<QRHistoryEntry[]>([])

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const save = useCallback((config: QRConfig, thumbnail: string | null) => {
    if (!config.data.trim()) return
    setEntries((prev) => {
      const next = [
        { config, timestamp: Date.now(), thumbnail },
        ...prev.filter((e) => e.config.data !== config.data),
      ].slice(0, MAX_ENTRIES)
      persistEntries(next)
      return next
    })
  }, [])

  const remove = useCallback((timestamp: number) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.timestamp !== timestamp)
      persistEntries(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    setEntries([])
    persistEntries([])
  }, [])

  return { entries, save, remove, clear }
}
