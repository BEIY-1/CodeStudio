import { useState, useCallback, useRef } from 'react'
import { Upload, Copy, Check, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { decodeFromImageData, type DecodeResult } from '../utils/decode'
import { useScanStore } from '@/stores/scan-store'
import { copyText } from '@/lib/clipboard'

export function MultiCodeDecoder(): JSX.Element {
  const [results, setResults] = useState<DecodeResult[]>([])
  const [isDecoding, setIsDecoding] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const addEntry = useScanStore((s) => s.addEntry)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setIsDecoding(true)
    setPreviewUrl(URL.createObjectURL(file))
    setResults([])
    try {
      const img = await loadImageFromFile(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No canvas context')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const found = await decodeFromImageData(imageData)
      setResults(found)
      if (found.length > 0) {
        found.forEach((r) => addEntry(r.text, r.format, 'multi'))
        toast({ type: 'success', title: `识别到 ${found.length} 个码` })
      } else {
        toast({ type: 'warning', title: '未识别到二维码或条码' })
      }
    } catch (err) {
      console.error('Multi-decode failed:', err)
      toast({ type: 'error', title: '解码失败', description: String(err) })
    } finally {
      setIsDecoding(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file && ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'].includes(file.type)) {
        processFile(file)
      }
    },
    [processFile],
  )

  const copyToClipboard = useCallback(async (text: string, idx: number) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer',
          dragOver
            ? 'border-brand-accent bg-brand-accent/5'
            : 'border-brand-border hover:border-brand-border-hover',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 rounded-full bg-brand-accent/10">
            <Grid3X3 className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <p className="text-brand-text-primary font-medium">拖拽含多个二维码/条码的图片</p>
            <p className="text-sm text-brand-text-secondary mt-1">
              支持同时识别 QR × 20 + Barcode × 50
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="flex justify-center">
          <img src={previewUrl} alt="Preview" className="max-h-48 rounded-lg object-contain" />
        </div>
      )}

      {/* Loading */}
      {isDecoding && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-brand-text-secondary mt-2">多码识别中...</p>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-brand-text-secondary">
              识别结果 ({results.length} 个码)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg border border-brand-border hover:border-brand-border-hover transition-colors group"
                >
                  <span className="text-xs font-mono text-brand-text-muted w-6 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-brand-text-primary truncate">
                      {result.text}
                    </p>
                    <p className="text-xs text-brand-text-muted">{result.format}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 opacity-0 group-hover:opacity-100"
                    onClick={() => copyToClipboard(result.text, idx)}
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3 h-3 text-brand-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new window.Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
