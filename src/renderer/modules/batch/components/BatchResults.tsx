import { Download, Check, X, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import type { BatchResult } from '../utils/batch-generate'

interface BatchResultsProps {
  results: BatchResult[]
}

export function BatchResults({ results }: BatchResultsProps): JSX.Element {
  const successCount = results.filter((r) => r.status === 'success').length
  const failCount = results.filter((r) => r.status === 'failed').length

  const handleExportAll = async () => {
    const dirResult = await window.api.file.openDirectory()
    if (!dirResult.dirPath) return

    let exported = 0
    for (const result of results) {
      if (result.status !== 'success' || !result.dataUrl) continue

      const base64 = result.dataUrl.split(',')[1]
      if (!base64) continue

      const isSvg = result.dataUrl.startsWith('data:image/svg+xml')
      const ext = isSvg ? 'svg' : 'png'
      const filename = `batch-${result.index + 1}.${ext}`
      const filePath = `${dirResult.dirPath}\\${filename}`
      const encoding = isSvg ? 'utf-8' : 'base64'
      const data = isSvg ? atob(base64) : base64

      const writeResult = await window.api.file.write(filePath, data, encoding)
      if (writeResult.success) exported++
    }

    toast({ type: 'success', title: `已导出 ${exported} 个文件` })
  }

  const handleExportSingle = async (result: BatchResult) => {
    if (!result.dataUrl) return
    try {
      const base64 = result.dataUrl.split(',')[1]
      if (!base64) return

      // Detect MIME type from dataUrl: QR → PNG, barcode → SVG
      const isSvg = result.dataUrl.startsWith('data:image/svg+xml')
      const ext = isSvg ? 'svg' : 'png'
      const filterName = isSvg ? 'SVG Image' : 'PNG Image'
      const filename = `batch-${result.index + 1}.${ext}`

      const saveResult = await window.api.file.saveDialog(filename, [
        { name: filterName, extensions: [ext] },
      ])
      if (saveResult.filePath && base64) {
        const encoding = isSvg ? 'utf-8' : 'base64'
        const data = isSvg ? atob(base64) : base64
        await window.api.file.write(saveResult.filePath, data, encoding)
        toast({ type: 'success', title: `已导出: ${filename}` })
      }
    } catch {
      toast({ type: 'error', title: '导出失败' })
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-brand-text-secondary">
          生成结果 (成功 {successCount} / 失败 {failCount})
        </CardTitle>
        {successCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleExportAll}>
            <Download className="w-3 h-3 mr-1" /> 导出全部
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 max-h-[500px] overflow-y-auto">
          {results.map((result) => (
            <div
              key={result.index}
              className={`relative p-3 rounded-lg border text-center ${
                result.status === 'success'
                  ? 'border-brand-border bg-brand-surface hover:border-brand-border-hover'
                  : 'border-brand-danger/30 bg-brand-danger/5'
              }`}
            >
              {/* Status icon */}
              <div className="absolute top-1.5 right-1.5">
                {result.status === 'success' ? (
                  <Check className="w-3 h-3 text-brand-success" />
                ) : (
                  <X className="w-3 h-3 text-brand-danger" />
                )}
              </div>

              {/* Preview */}
              {result.dataUrl ? (
                <img
                  src={result.dataUrl}
                  alt={`Result ${result.index + 1}`}
                  className="w-full h-24 object-contain mb-2 cursor-pointer"
                  onClick={() => handleExportSingle(result)}
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center mb-2">
                  <Image className="w-8 h-8 text-brand-text-muted opacity-30" />
                </div>
              )}

              {/* Label */}
              <p className="text-xs font-mono text-brand-text-primary truncate">
                {result.content.length > 20
                  ? result.content.slice(0, 20) + '...'
                  : result.content}
              </p>
              <p className="text-[10px] text-brand-text-muted mt-0.5">#{result.index + 1}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
