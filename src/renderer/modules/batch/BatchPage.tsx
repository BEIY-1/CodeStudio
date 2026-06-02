import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, QrCode, Barcode, Lock, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

function buildDefaultTemplate(columns: string[]): string {
  return columns.map((col) => `{${col}}`).join(',')
}

export default function BatchPage(): JSX.Element {
  const [rows, setRows] = useState<BatchRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [template, setTemplate] = useState('{"id": "{id}"}')
  const [batchType, setBatchType] = useState<BatchType>('qr')
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128')
  const [status, setStatus] = useState<BatchStatus>('idle')
  const [results, setResults] = useState<BatchResult[]>([])
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [encrypted, setEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const templateEditedRef = useRef(false)

  const canGenerate =
    rows.length > 0 &&
    template.trim().length > 0 &&
    status !== 'running' &&
    (!encrypted || password.trim().length > 0)

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setStatus('running')
    setResults([])
    setProgress({ current: 0, total: rows.length })

    try {
      const batchResults = await generateBatch(
        rows,
        template,
        encrypted ? 'qr' : batchType,
        barcodeFormat,
        (current, total) => setProgress({ current, total }),
        encrypted ? password : undefined,
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
  }, [canGenerate, rows, template, batchType, barcodeFormat, encrypted, password])

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
          <FileImporter
            onDataLoaded={(r, c) => {
              setRows(r)
              setColumns(c)
              if (c.length === 0) {
                // File was cleared — reset edit flag for next import
                templateEditedRef.current = false
              } else if (!templateEditedRef.current) {
                // Only auto-generate template if user hasn't manually edited it
                setTemplate(buildDefaultTemplate(c))
              }
            }}
          />
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
                    onClick={() => !encrypted && setBatchType('barcode')}
                    disabled={encrypted}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
                      encrypted && 'opacity-40 cursor-not-allowed',
                      batchType === 'barcode'
                        ? 'bg-brand-accent/10 text-brand-accent'
                        : 'text-brand-text-secondary hover:text-brand-text-primary',
                    )}
                  >
                    <Barcode className="w-4 h-4" /> 条码
                  </button>
                  {!encrypted && batchType === 'barcode' && (
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

                {/* Encryption toggle */}
                <label className="flex items-center gap-3 p-3 rounded-lg border border-brand-border cursor-pointer hover:border-brand-border-hover transition-colors">
                  <input
                    type="checkbox"
                    checked={encrypted}
                    onChange={(e) => {
                      setEncrypted(e.target.checked)
                      if (e.target.checked) setBatchType('qr')
                    }}
                    className="accent-brand-primary w-4 h-4"
                  />
                  <Lock className="w-4 h-4 text-brand-accent" />
                  <div>
                    <p className="text-sm font-medium text-brand-text-primary">AES-256-GCM 加密</p>
                    <p className="text-xs text-brand-text-secondary">内容加密后生成，需密码才能解密</p>
                  </div>
                </label>

                {/* Password input */}
                {encrypted && (
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="设置解密密码..."
                      className="pr-10 font-mono"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                )}

                <TemplateEditor
                  columns={columns}
                  template={template}
                  onChange={(t) => {
                    templateEditedRef.current = true
                    setTemplate(t)
                  }}
                />
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
                      <Play className="w-4 h-4 mr-2" />
                      {encrypted ? '生成加密二维码' : '开始生成'}
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
