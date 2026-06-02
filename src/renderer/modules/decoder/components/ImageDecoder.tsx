import { useState, useCallback, useRef } from 'react'
import { Upload, X, Copy, Check, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { decodeSingleFromImageData, type DecodeResult } from '../utils/decode'
import { useScanStore } from '@/stores/scan-store'
import { copyText } from '@/lib/clipboard'

export function ImageDecoder(): JSX.Element {
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
    try {
      const img = await loadImageFromFile(file)
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('No canvas context')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const result = await decodeSingleFromImageData(imageData)
      if (result) {
        setResults([result])
        addEntry(result.text, result.format, 'image')
        toast({ type: 'success', title: `识别成功: ${result.format}` })
      } else {
        setResults([])
        toast({ type: 'warning', title: '未识别到二维码或条码' })
      }
    } catch (err) {
      console.error('Image decode failed:', err)
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
      } else {
        toast({ type: 'error', title: '不支持的文件格式，请使用 JPG/PNG/WebP/BMP' })
      }
    },
    [processFile],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const copyToClipboard = useCallback(
    async (text: string, idx: number) => {
      const ok = await copyText(text)
      if (ok) {
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 2000)
      } else {
        toast({ type: 'error', title: '复制失败' })
      }
    },
    [],
  )

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
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-brand-border hover:border-brand-border-hover',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/bmp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-64 rounded-lg object-contain mx-auto"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setPreviewUrl(null)
                setResults([])
              }}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-brand-danger text-white hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-brand-primary/10">
              <Upload className="w-8 h-8 text-brand-primary" />
            </div>
            <div>
              <p className="text-brand-text-primary font-medium">拖拽图片到此处</p>
              <p className="text-sm text-brand-text-secondary mt-1">
                支持 JPG / PNG / WebP / BMP
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isDecoding && (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-sm text-brand-text-secondary mt-2">解码中...</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-brand-text-secondary">
              识别结果 ({results.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg bg-brand-bg border border-brand-border"
              >
                <Image className="w-4 h-4 text-brand-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-brand-text-primary truncate">
                    {result.text}
                  </p>
                  <p className="text-xs text-brand-text-muted">{result.format}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(result.text, idx)}
                >
                  {copiedIdx === idx ? (
                    <Check className="w-4 h-4 text-brand-success" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
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
