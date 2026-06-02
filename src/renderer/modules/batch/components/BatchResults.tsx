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
    const result = await window.api.file.saveDialog('batch-export.zip', [
      { name: 'Files', extensions: ['zip'] },
    ])
    if (result.filePath) {
      // Export as a simple directory approach - save each as individual file
      // In practice, use archiver for zip. For MVP, show a summary
      const summary = results
        .filter((r) => r.status === 'success')
        .map((r) => `${r.content}`)
        .join('\n')

      const summaryPath = result.filePath.replace('.zip', '.txt')
      await window.api.file.write(summaryPath, summary)
      toast({ type: 'success', title: `已导出 ${successCount} 条` })
    }
  }

  const handleExportSingle = async (result: BatchResult) => {
    if (!result.dataUrl) return
    try {
      // Convert dataUrl to blob-like data
      const base64 = result.dataUrl.split(',')[1]
      if (!base64) return
      const filename = `batch-${result.index + 1}.png`
      const saveResult = await window.api.file.saveDialog(filename, [
        { name: 'PNG Image', extensions: ['png'] },
      ])
      if (saveResult.filePath && base64) {
        await window.api.file.write(saveResult.filePath, base64, 'base64')
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
