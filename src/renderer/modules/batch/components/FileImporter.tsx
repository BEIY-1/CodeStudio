import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, FileText, Table2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { BatchRow } from '../utils/batch-generate'

interface FileImporterProps {
  onDataLoaded: (rows: BatchRow[], columns: string[]) => void
}

export function FileImporter({ onDataLoaded }: FileImporterProps): JSX.Element {
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ columns: string[]; rows: BatchRow[] } | null>(null)
  const [firstRowAsHeader, setFirstRowAsHeader] = useState(true)
  const firstRowAsHeaderRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)

  const parseFile = useCallback(
    async (file: File, useHeader: boolean) => {
      setFileName(file.name)
      lastFileRef.current = file
      try {
        const data = await file.arrayBuffer()
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('No sheet found')

        const sheet = workbook.Sheets[sheetName]!

        let jsonData: BatchRow[]
        let columns: string[]

        if (useHeader) {
          // First row is header
          jsonData = XLSX.utils.sheet_to_json<BatchRow>(sheet, { defval: '' })
          if (jsonData.length === 0) throw new Error('Empty file')
          columns = Object.keys(jsonData[0]!)
        } else {
          // First row is data — generate generic column names
          const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' })
          if (rawRows.length === 0) throw new Error('Empty file')
          const maxCols = Math.max(...rawRows.map((r) => r.length))
          columns = Array.from({ length: maxCols }, (_, i) => `列${i + 1}`)
          jsonData = rawRows.map((row) => {
            const obj: BatchRow = {}
            columns.forEach((col, i) => {
              obj[col] = row[i] ?? ''
            })
            return obj
          })
        }

        setPreview({ columns, rows: jsonData.slice(0, 10) })
        onDataLoaded(jsonData, columns)
        toast({
          type: 'success',
          title: `导入成功: ${jsonData.length} 行, ${columns.length} 列`,
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        toast({ type: 'error', title: '导入失败', description: msg })
      }
    },
    [onDataLoaded],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) parseFile(file, firstRowAsHeaderRef.current)
    },
    [parseFile],
  )

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          dragOver
            ? 'border-brand-primary bg-brand-primary/5'
            : 'border-brand-border hover:border-brand-border-hover',
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) parseFile(file, firstRowAsHeaderRef.current)
          }}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <FileSpreadsheet className="w-8 h-8 text-brand-success" />
            <FileText className="w-8 h-8 text-brand-accent" />
          </div>
          <div>
            <p className="text-brand-text-primary font-medium">拖拽或点击导入文件</p>
            <p className="text-sm text-brand-text-secondary mt-1">支持 Excel (.xlsx/.xls) 和 CSV</p>
          </div>
        </div>
      </div>

      {/* Header toggle */}
      <div className="flex items-center gap-2 text-sm">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={firstRowAsHeader}
            onChange={(e) => {
              setFirstRowAsHeader(e.target.checked)
              firstRowAsHeaderRef.current = e.target.checked
              if (lastFileRef.current) {
                parseFile(lastFileRef.current, e.target.checked)
              }
            }}
            className="sr-only peer"
          />
          <div className="w-8 h-4 bg-brand-border rounded-full peer peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all" />
        </label>
        <span className="text-brand-text-secondary">首行为表头</span>
      </div>

      {/* File info */}
      {fileName && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-hover text-sm">
          {fileName.endsWith('.csv') ? (
            <FileText className="w-4 h-4 text-brand-accent" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-brand-success" />
          )}
          <span className="text-brand-text-primary">{fileName}</span>
          <button
            onClick={() => {
              setFileName(null)
              setPreview(null)
              onDataLoaded([], [])
            }}
            className="ml-auto text-brand-text-muted hover:text-brand-danger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preview table */}
      {preview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-text-secondary">
              <Table2 className="w-4 h-4" />
              数据预览 ({preview.rows.length} / {preview.rows.length}+ 行)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border">
                    {preview.columns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 text-left text-xs font-medium text-brand-text-muted font-mono"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="border-b border-brand-border/50 hover:bg-brand-hover">
                      {preview.columns.map((col) => (
                        <td key={col} className="px-3 py-1.5 text-brand-text-primary font-mono text-xs">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
