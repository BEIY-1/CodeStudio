import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, QrCode, Barcode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { FileImporter } from './components/FileImporter'
import { TemplateEditor } from './components/TemplateEditor'
import { BatchResults } from './components/BatchResults'
import {
  generateBatch,
  type BatchRow,
  type BatchType,
  type BatchResult,
  type BatchStatus,
} from './utils/batch-generate'

export default function BatchPage(): JSX.Element {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [template, setTemplate] = useState('{"id": "{id}"}')
  const [batchType, setBatchType] = useState<BatchType>('qr')
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128')
  const [status, setStatus] = useState<BatchStatus>('idle')
  const [results, setResults] = useState<BatchResult[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const canGenerate = rows.length > 0 && template.trim().length > 0 && status !== 'running'

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setStatus('running')
    setResults([])
    setProgress({ current: 0, total: rows.length })

    try {
      const batchResults = await generateBatch(
        rows,
        template,
        batchType,
        barcodeFormat,
        (current, total) => setProgress({ current, total }),
      )
      setResults(batchResults)
      setStatus('done')
      toast({
        type: 'success',
        title: `批量生成完成: ${batchResults.filter((r) => r.status === 'success').length}/${rows.length}`,
      })
    } catch (err) {
      setStatus('error')
      toast({ type: 'error', title: '批量生成失败', description: String(err) })
    }
  }, [canGenerate, rows, template, batchType, barcodeFormat])

  const handleStop = useCallback(() => {
    setStatus('idle')
  }, [])

  return (
    <div className="h-full p-8 flex flex-col">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-text-primary">批量中心</h1>
        <p className="mt-2 text-brand-text-secondary">
          Excel/CSV 导入 · 模板变量 · 批量生成二维码或条码
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Step 1: Import */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="font-display text-base font-semibold text-brand-text-primary">导入数据</h2>
          </div>
          <FileImporter onDataLoaded={(r, c) => { setRows(r); setColumns(c) }} />
        </div>

        {/* Step 2: Template */}
        {columns.length > 0 && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-display text-base font-semibold text-brand-text-primary">
                  配置模板
                </h2>
              </div>

              <div className="space-y-4">
                {/* Type selector */}
                <div className="flex gap-1 bg-brand-surface rounded-lg p-1 w-fit border border-brand-border">
                  <button
                    onClick={() => setBatchType('qr')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
                      batchType === 'qr'
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-brand-text-secondary hover:text-brand-text-primary',
                    )}
                  >
                    <QrCode className="w-4 h-4" /> QR Code
                  </button>
                  <button
                    onClick={() => setBatchType('barcode')}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
                      batchType === 'barcode'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-brand-text-secondary hover:text-brand-text-primary',
                    )}
                  >
                    <Barcode className="w-4 h-4" /> 条码
                  </button>
                  {batchType === 'barcode' && (
                    <select
                      value={barcodeFormat}
                      onChange={(e) => setBarcodeFormat(e.target.value)}
                      className="bg-transparent border-l border-brand-border px-2 text-sm text-brand-text-primary focus:outline-none"
                    >
                      <option value="CODE128">Code128</option>
                      <option value="CODE39">Code39</option>
                      <option value="EAN13">EAN-13</option>
                      <option value="EAN8">EAN-8</option>
                      <option value="UPC">UPC</option>
                    </select>
                  )}
                </div>

                <TemplateEditor columns={columns} template={template} onChange={setTemplate} />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Step 3: Generate */}
        {rows.length > 0 && template && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-brand-success/10 text-brand-success text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h2 className="font-display text-base font-semibold text-brand-text-primary">
                  生成 ({rows.length} 条)
                </h2>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="min-w-[140px]"
                >
                  {status === 'running' ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" /> 开始生成
                    </>
                  )}
                </Button>

                {status === 'running' && (
                  <Button variant="destructive" onClick={handleStop}>
                    <Square className="w-4 h-4 mr-2" /> 停止
                  </Button>
                )}

                {/* Progress */}
                {status === 'running' && (
                  <div className="flex-1">
                    <div className="h-2 bg-brand-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary transition-all duration-300"
                        style={{
                          width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-brand-text-muted mt-1">
                      {progress.current} / {progress.total}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Results */}
        {results.length > 0 && <BatchResults results={results} />}
      </div>
    </div>
  )
}
