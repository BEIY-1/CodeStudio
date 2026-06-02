import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import {
  X, FileSpreadsheet, FileText, Play, Square,
  FileImage, FileArchive, CheckCircle, AlertCircle, Loader2, Braces, Eye,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useLabelStore } from '../store'
import { generateBatchLabels, parseTemplate, type BatchRow, type BatchLabelResult } from '../utils/label-batch-generate'

interface Props { onClose: () => void }

export function BatchLabelDialog({ onClose }: Props): JSX.Element {
  const { elements, canvasWidth, canvasHeight } = useLabelStore()

  // -- file import --
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [rows, setRows] = useState<BatchRow[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [previewRows, setPreviewRows] = useState<BatchRow[]>([])
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(true)
  const [headerLooksLikeData, setHeaderLooksLikeData] = useState(false)
  const firstRowAsHeaderRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)

  // -- element content overrides (for batch mode) --
  const [contentOverrides, setContentOverrides] = useState<Record<string, string>>({})

  // -- generation --
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<BatchLabelResult[]>([])
  const abortRef = useRef(false)

  // Content elements (exclude images)
  const contentElements = useMemo(
    () => elements.filter((el) => el.type === 'qr' || el.type === 'barcode' || el.type === 'text'),
    [elements],
  )

  // Get current content for an element (override or original)
  const getContent = useCallback((el: typeof elements[number]) => {
    if (contentOverrides[el.id] !== undefined) return contentOverrides[el.id]!
    return el.qrContent ?? el.barcodeContent ?? el.textContent ?? ''
  }, [contentOverrides])

  // Check if any element uses {var} placeholders
  const hasPlaceholders = useMemo(() => {
    for (const el of contentElements) {
      if (/\{[^}]+\}/.test(getContent(el))) return true
    }
    return false
  }, [contentElements, getContent])

  // -- parse file --
  const parseFile = useCallback(async (file: File, useHeader: boolean) => {
    setFileName(file.name)
    lastFileRef.current = file
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]!]!
      let jsonData: BatchRow[]; let cols: string[]

      if (useHeader) {
        jsonData = XLSX.utils.sheet_to_json<BatchRow>(sheet, { defval: '' })
        if (!jsonData.length) throw new Error('文件为空')
        const rawCols = Object.keys(jsonData[0]!)
        cols = rawCols.map((c) => c.trim())
        jsonData = jsonData.map((row) => { const t: BatchRow = {}; for (const [k, v] of Object.entries(row)) t[k.trim()] = v as string; return t })
      } else {
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
        if (!rawRows.length) throw new Error('文件为空')
        const maxCols = Math.max(...rawRows.map((r) => r.length))
        cols = Array.from({ length: maxCols }, (_, i) => `列${i + 1}`)
        jsonData = rawRows.map((row) => { const o: BatchRow = {}; cols.forEach((c, i) => { o[c] = row[i] ?? '' }); return o })
      }

      setColumns(cols)
      setRows(jsonData)
      setPreviewRows(jsonData.slice(0, 8))
      setStatus('idle')
      setResults([])

      // Detect header-looks-like-data
      if (useHeader && cols.length > 0) {
        const allUnique = new Set(cols).size === cols.length
        const looksNumeric = cols.every((c) => /^\d+$/.test(c))
        const hasChinese = cols.some((c) => /[一-鿿]/.test(c))
        const typical = /^(id|name|code|no|编号|姓名|名称|代码|序号|日期|价格|数量)$/i
        setHeaderLooksLikeData(allUnique && (looksNumeric || hasChinese) && !cols.some((c) => typical.test(c)))
      } else { setHeaderLooksLikeData(false) }

      toast({ type: 'success', title: `已导入 ${jsonData.length} 行, ${cols.length} 列` })
    } catch (err) { toast({ type: 'error', title: '导入失败', description: String(err) }) }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) parseFile(f, firstRowAsHeaderRef.current)
  }, [parseFile])

  // Insert {col} placeholder into an element's content field
  const insertVar = useCallback((elId: string, col: string) => {
    setContentOverrides((prev) => {
      const current = prev[elId] ?? elements.find((e) => e.id === elId)?.qrContent ?? elements.find((e) => e.id === elId)?.barcodeContent ?? elements.find((e) => e.id === elId)?.textContent ?? ''
      return { ...prev, [elId]: current + `{${col}}` }
    })
  }, [elements])

  // -- generate --
  const handleGenerate = useCallback(async () => {
    if (!rows.length) return
    setStatus('running')
    setProgress({ current: 0, total: rows.length })
    abortRef.current = false

    // Build elements with overridden content
    const batchElements = elements.map((el) => {
      const override = contentOverrides[el.id]
      if (override === undefined) return el
      return { ...el, qrContent: el.type === 'qr' ? override : el.qrContent, barcodeContent: el.type === 'barcode' ? override : el.barcodeContent, textContent: el.type === 'text' ? override : el.textContent }
    })

    const res = await generateBatchLabels(batchElements, rows, canvasWidth, canvasHeight,
      (c, t) => { if (!abortRef.current) setProgress({ current: c, total: t }) },
    )

    const filtered = abortRef.current ? res.filter((r) => r.status !== 'success').map((r) => ({ ...r, status: 'failed' as const, error: '已取消' })) : res
    setResults(filtered); setStatus('done')
    const ok = filtered.filter((r) => r.status === 'success').length

    if (ok > 1 && new Set(filtered.filter((r) => r.dataUrl).map((r) => r.dataUrl)).size === 1) {
      toast({ type: 'error', title: '所有标签内容相同', description: '请在元素内容中使用 {列名} 引用数据列，确保每行数据不同。' })
    } else {
      toast({ type: ok ? 'success' : 'error', title: abortRef.current ? '已取消' : `生成完成 ${ok}/${filtered.length}` })
    }
  }, [rows, elements, canvasWidth, canvasHeight, contentOverrides])

  const handleStop = useCallback(() => { abortRef.current = true }, [])

  // -- export --
  const handleExportAll = useCallback(async () => {
    const ok = results.filter((r) => r.status === 'success' && r.dataUrl)
    if (!ok.length) return
    const dir = await window.api.file.openDirectory()
    if (!dir.dirPath) return
    let n = 0
    for (const r of ok) {
      const b64 = r.dataUrl!.split(',')[1]; if (!b64) continue
      try { await window.api.file.write(`${dir.dirPath}\\label_${r.index + 1}.png`, b64, 'base64'); n++ } catch { /* skip */ }
    }
    toast({ type: 'success', title: `已导出 ${n} 个` })
  }, [results])

  const handleExportPdf = useCallback(async () => {
    const ok = results.filter((r) => r.status === 'success' && r.dataUrl)
    if (!ok.length) return
    const probe = new Image()
    probe.src = ok[0]!.dataUrl!
    await new Promise<void>((resolve, reject) => { probe.onload = () => resolve(); probe.onerror = reject })
    const pxW = probe.width
    const pxH = probe.height
    // Use px unit with hotfix — jsPDF 2.5.2 supports this for pixel-accurate sizing
    // Explicit orientation prevents portrait-default rotation from swapping w/h
    const pdf = new jsPDF({
      unit: 'px',
      format: [pxW, pxH],
      hotfixes: ['px_scaling'],
      orientation: pxW >= pxH ? 'landscape' : 'portrait',
    })
    for (let i = 0; i < ok.length; i++) {
      if (i > 0) pdf.addPage([pxW, pxH], pxW >= pxH ? 'landscape' : 'portrait')
      pdf.addImage(ok[i]!.dataUrl!, 'PNG', 0, 0, pxW, pxH)
    }
    const b64 = pdf.output('datauristring').split(',')[1]; if (!b64) return
    const s = await window.api.file.saveDialog('labels.pdf', [{ name: 'PDF', extensions: ['pdf'] }])
    if (s.filePath) { await window.api.file.write(s.filePath, b64, 'base64'); toast({ type: 'success', title: `PDF 已导出 (${ok.length} 页)` }) }
  }, [results])

  useEffect(() => { return () => { abortRef.current = true } }, [])

  const ok = results.filter((r) => r.status === 'success').length
  const fail = results.filter((r) => r.status === 'failed').length
  const canGen = rows.length > 0 && contentElements.length > 0

  // First row for preview
  const firstRow = rows[0] ?? null

  // -- render --
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-brand-surface border border-brand-border rounded-xl w-[800px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* ---- Header ---- */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-brand-text-primary">批量标签生成</h2>
            <p className="text-xs text-brand-text-muted mt-0.5">导入数据 → 元素内容中用 {`{列名}`} 引用数据列 → 逐行生成</p>
          </div>
          <button onClick={onClose} className="text-brand-text-muted hover:text-brand-text-primary"><X className="w-5 h-5" /></button>
        </div>

        {/* ---- Body ---- */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Upload */}
          {status === 'idle' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
                className={cn('border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer', dragOver ? 'border-brand-primary bg-brand-primary/5' : 'border-brand-border hover:border-brand-border-hover')}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f, firstRowAsHeaderRef.current) }} className="hidden"
                />
                <FileSpreadsheet className="w-7 h-7 text-brand-success mx-auto mb-1.5" />
                <p className="text-brand-text-primary font-medium text-sm">拖拽或点击导入 Excel / CSV</p>
                <p className="text-xs text-brand-text-secondary mt-0.5">.xlsx .xls .csv</p>
              </div>

              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={firstRowAsHeader}
                    onChange={(e) => { setFirstRowAsHeader(e.target.checked); firstRowAsHeaderRef.current = e.target.checked; if (lastFileRef.current) parseFile(lastFileRef.current, e.target.checked) }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-brand-border rounded-full peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative" />
                </label>
                <span className="text-xs text-brand-text-secondary">第一行是列名（表头）</span>
              </div>

              {headerLooksLikeData && firstRowAsHeader && (
                <div className="p-3 rounded-lg bg-brand-warning/10 border border-brand-warning/20 text-xs text-brand-text-secondary flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-warning shrink-0 mt-0.5" />
                  <div>列名 {columns.slice(0,5).map(c => `"${c}"`).join(', ')} 看起来像数据。建议取消勾选<b>「第一行是列名」</b>。</div>
                </div>
              )}
            </>
          )}

          {/* ---- Data loaded: columns + elements ---- */}
          {fileName && rows.length > 0 && status === 'idle' && (
            <>
              {/* Data table */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 px-1 text-xs text-brand-text-muted">
                  {fileName.endsWith('.csv') ? <FileText className="w-3.5 h-3.5" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                  {fileName} · {rows.length} 行 · {columns.length} 列
                </div>
                <div className="overflow-x-auto rounded-lg border border-brand-border max-h-28">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-brand-bg/50">
                        <th className="px-2 py-1 text-left text-brand-text-muted font-normal text-[10px]">#</th>
                        {columns.map((col) => (
                          <th key={col} className="px-3 py-1 text-left font-medium text-brand-text-secondary font-mono whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-brand-border/50 hover:bg-brand-hover">
                          <td className="px-2 py-0.5 text-brand-text-muted text-[10px]">{i + 1}</td>
                          {columns.map((col) => (
                            <td key={col} className="px-3 py-0.5 text-brand-text-primary font-mono whitespace-nowrap">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Element content editors with per-element column chips */}
              {contentElements.length > 0 && (
                <div className="rounded-lg border border-brand-border bg-brand-bg/30 p-4 space-y-4">
                  <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                    <Braces className="w-3.5 h-3.5" />
                    编辑元素内容，点击下方列名按钮插入变量
                  </div>
                  {contentElements.map((el) => {
                    const typeLabel = el.type === 'qr' ? '二维码' : el.type === 'barcode' ? '条码' : '文本'
                    const typeColor = el.type === 'qr' ? 'text-purple-400' : el.type === 'barcode' ? 'text-cyan-400' : 'text-amber-400'
                    const currentContent = getContent(el)
                    const resolved = firstRow ? parseTemplate(currentContent, firstRow) : currentContent
                    const changed = currentContent !== resolved

                    return (
                      <div key={el.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('text-xs font-medium w-10 shrink-0', typeColor)}>{typeLabel}</span>
                          <input
                            value={currentContent}
                            onChange={(e) => setContentOverrides((prev) => ({ ...prev, [el.id]: e.target.value }))}
                            placeholder={el.type === 'qr' ? '二维码内容...' : el.type === 'barcode' ? '条码内容...' : '文本内容...'}
                            className="flex-1 rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          />
                        </div>
                        {/* Per-element column chips */}
                        <div className="flex items-center gap-1 pl-12 flex-wrap">
                          <span className="text-[10px] text-brand-text-muted mr-0.5">插入:</span>
                          {columns.length === 0 && (
                            <span className="text-[10px] text-brand-text-muted">请先导入数据</span>
                          )}
                          {columns.map((col) => (
                            <button
                              key={col}
                              onClick={() => {
                                const prev = contentOverrides[el.id] ?? el.qrContent ?? el.barcodeContent ?? el.textContent ?? ''
                                setContentOverrides((c) => ({ ...c, [el.id]: prev + `{${col}}` }))
                              }}
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 active:bg-brand-primary/30 transition-colors cursor-pointer select-none"
                              title={`插入 {${col}} 到${typeLabel}内容`}
                            >
                              {`+{${col}}`}
                            </button>
                          ))}
                        </div>
                        {/* Live preview of first row */}
                        {firstRow && currentContent && (
                          <div className="flex items-center gap-1.5 pl-12">
                            <Eye className="w-3 h-3 text-brand-text-muted shrink-0" />
                            {changed ? (
                              <code className="text-xs text-brand-success font-mono truncate">{resolved || '(空)'}</code>
                            ) : (
                              <span className="text-[10px] text-brand-warning">未检测到变量 — 所有行将相同</span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Quick-action: link all elements to columns */}
                  {contentElements.length >= 1 && columns.length >= 1 && (
                    <div className="flex gap-2 pt-1 border-t border-brand-border/50">
                      <span className="text-[10px] text-brand-text-muted">快捷关联：</span>
                      {columns.map((col, i) => {
                        const el = contentElements[i]
                        if (!el) return null
                        return (
                          <button
                            key={col}
                            onClick={() => insertVar(el.id, col)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-brand-bg border border-brand-border text-brand-text-secondary hover:text-brand-primary hover:border-brand-primary transition-colors"
                          >
                            {`${el.type === 'qr' ? 'QR' : el.type === 'barcode' ? '条码' : '文本'}←${col}`}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Warning */}
              {!hasPlaceholders && (
                <div className="p-2.5 rounded-lg bg-brand-warning/10 border border-brand-warning/20 text-xs text-brand-text-secondary flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-brand-warning shrink-0 mt-0.5" />
                  <div>元素内容中未使用 {`{列名}`} 变量。请点击上方列名按钮添加到内容中，或手动输入，否则所有标签将完全相同。</div>
                </div>
              )}
            </>
          )}

          {/* ---- Progress ---- */}
          {status === 'running' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
              <span className="text-sm text-brand-text-primary">{progress.current} / {progress.total}</span>
              <div className="w-48 h-2 bg-brand-border rounded-full overflow-hidden">
                <div className="h-full bg-brand-primary rounded-full transition-all" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
              </div>
              <button onClick={handleStop} className="px-3 py-1 text-xs rounded-md bg-brand-danger/10 text-brand-danger hover:bg-brand-danger/20"><Square className="w-3 h-3 inline mr-1" />停止</button>
            </div>
          )}

          {/* ---- Results ---- */}
          {status === 'done' && results.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-brand-text-primary"><span className="text-brand-success font-semibold">{ok}</span> 成功{fail > 0 && <><span className="text-brand-danger font-semibold ml-1">{fail}</span> 失败</>}</p>
              <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {results.map((r) => (
                  <div key={r.index} className={cn('rounded-lg border p-1.5 bg-brand-bg', r.status === 'success' ? 'border-brand-border' : 'border-brand-danger/30')}>
                    {r.dataUrl ? <img src={r.dataUrl} alt={`#${r.index + 1}`} className="w-full rounded" /> : <div className="aspect-[4/3] flex items-center justify-center text-xs text-brand-text-muted">-</div>}
                    <div className="mt-1 text-[10px] text-brand-text-secondary flex items-center gap-1">{r.status === 'success' ? <CheckCircle className="w-3 h-3 text-brand-success" /> : <AlertCircle className="w-3 h-3 text-brand-danger" />}#{r.index + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border shrink-0 bg-brand-bg/30">
          <span className="text-xs text-brand-text-muted">{status === 'idle' && `画布 ${canvasWidth}×${canvasHeight} · ${elements.length} 个元素`}</span>
          <div className="flex gap-2 ml-auto">
            {status === 'idle' && rows.length > 0 && (
              <button onClick={handleGenerate} disabled={!canGen}
                className={cn('px-4 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-colors', canGen ? 'bg-brand-primary text-white hover:bg-brand-primary/90' : 'bg-brand-border text-brand-text-muted cursor-not-allowed')}
              ><Play className="w-4 h-4" /> 生成 {rows.length} 个标签</button>
            )}
            {status === 'done' && ok > 0 && (<>
              <button onClick={handleExportAll} className="px-3 py-1.5 text-xs rounded-md bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-hover flex items-center gap-1.5"><FileImage className="w-3.5 h-3.5" /> 导出 PNG</button>
              <button onClick={handleExportPdf} className="px-3 py-1.5 text-xs rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 flex items-center gap-1.5"><FileArchive className="w-3.5 h-3.5" /> 导出 PDF</button>
            </>)}
            <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-md text-brand-text-secondary hover:text-brand-text-primary">关闭</button>
          </div>
        </div>
      </div>
    </div>
  )
}
