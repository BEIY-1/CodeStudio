import { useState, useEffect, useCallback, useRef } from 'react'

interface ScanEntry {
  text: string
  timestamp: number
}

interface UseScannerGunReturn {
  entries: ScanEntry[]
  isListening: boolean
  clearEntries: () => void
  removeEntry: (index: number) => void
}

const SCANNER_GUN_TIMEOUT = 100 // ms — scanner guns type very fast, but need margin

export function useScannerGun(): UseScannerGunReturn {
  const [entries, setEntries] = useState<ScanEntry[]>([])
  const [isListening, setIsListening] = useState(true)
  const bufferRef = useRef<string>('')
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Scanner guns type very fast and end with Enter
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (e.key === 'Enter') {
      if (bufferRef.current.length > 0) {
        setEntries((prev) => [
          { text: bufferRef.current, timestamp: Date.now() },
          ...prev,
        ])
        bufferRef.current = ''
      }
      e.preventDefault()
      return
    }

    // Only capture printable characters (typical scanner gun behavior)
    if (e.key.length === 1) {
      bufferRef.current += e.key
    }

    // Timeout means user is typing manually, not scanning
    timerRef.current = setTimeout(() => {
      bufferRef.current = ''
    }, SCANNER_GUN_TIMEOUT)
  }, [])

  useEffect(() => {
    if (isListening) {
      window.addEventListener('keydown', handleKeyPress)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isListening, handleKeyPress])

  const clearEntries = useCallback(() => setEntries([]), [])
  const removeEntry = useCallback(
    (index: number) => {
      setEntries((prev) => prev.filter((_, i) => i !== index))
    },
    [],
  )

  return { entries, isListening, clearEntries, removeEntry }
}
