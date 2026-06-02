import { useCallback, useState, useRef, useEffect } from 'react'
import { Keyboard, Trash2, Copy, Check, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { useScannerGun } from '../hooks/useScannerGun'
import { useScanStore } from '@/stores/scan-store'
import { copyText } from '@/lib/clipboard'

export function ScannerGunDecoder(): JSX.Element {
  const { entries, clearEntries, removeEntry } = useScannerGun()
  const addEntry = useScanStore((s) => s.addEntry)

  // Sync scanner gun entries to global scan store
  const prevLenRef = useRef(entries.length)
  useEffect(() => {
    if (entries.length > prevLenRef.current) {
      const newEntries = entries.slice(0, entries.length - prevLenRef.current)
      newEntries.forEach((e) => addEntry(e.text, 'unknown', 'scanner_gun'))
    }
    prevLenRef.current = entries.length
  }, [entries, addEntry])
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [dedupe, setDedupe] = useState(true)

  const displayedEntries = dedupe
    ? entries.filter((e, i, arr) => arr.findIndex((x) => x.text === e.text) === i)
    : entries

  const copyToClipboard = useCallback(async (text: string, idx: number) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }, [])

  const exportCSV = useCallback(async () => {
    const csv = 'text,timestamp\n' + entries.map((e) => `"${e.text}",${new Date(e.timestamp).toISOString()}`).join('\n')
    const result = await window.api.file.saveDialog(`scan-${Date.now()}.csv`, [
      { name: 'CSV', extensions: ['csv'] },
    ])
    if (result.filePath) {
      await window.api.file.write(result.filePath, csv)
      toast({ type: 'success', title: '已导出 CSV' })
    }
  }, [entries])

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-4 p-6 rounded-xl border-2 border-dashed border-brand-success/30 bg-brand-success/5">
        <div className="relative">
          <Keyboard className="w-10 h-10 text-brand-success" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-brand-success rounded-full animate-pulse" />
        </div>
        <div>
          <p className="text-brand-text-primary font-medium">扫码枪监听中</p>
          <p className="text-sm text-brand-text-secondary">
            将光标放在任意位置，使用扫码枪扫描条码
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={dedupe}
            onChange={(e) => setDedupe(e.target.checked)}
            className="accent-brand-primary"
          />
          自动去重
        </label>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={entries.length === 0}>
          <Download className="w-3 h-3 mr-1" /> 导出 CSV
        </Button>
        <Button variant="ghost" size="sm" onClick={clearEntries} disabled={entries.length === 0}>
          <Trash2 className="w-3 h-3 mr-1" /> 清空
        </Button>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {displayedEntries.length === 0 ? (
            <div className="p-12 text-center text-brand-text-muted text-sm">
              <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-20" />
              等待扫码输入...
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border text-xs text-brand-text-muted">
                <span>共 {displayedEntries.length} 条</span>
                <span>时间</span>
              </div>
              {displayedEntries.map((entry, idx) => (
                <div
                  key={`${entry.timestamp}-${idx}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-brand-border last:border-0 hover:bg-brand-hover transition-colors group"
                >
                  <span className="text-xs text-brand-text-muted font-mono w-8 shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-mono text-brand-text-primary truncate">
                    {entry.text}
                  </span>
                  <span className="text-xs text-brand-text-muted shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(entry.text, idx)}
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3 h-3 text-brand-success" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeEntry(entries.indexOf(entry))}
                    >
                      <Trash2 className="w-3 h-3 text-brand-text-muted hover:text-brand-danger" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
