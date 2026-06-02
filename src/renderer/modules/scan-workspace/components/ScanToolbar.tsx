import { useState } from 'react'
import { Search, Download, Trash2, Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import type { ScanEntry } from '@/stores/scan-store'

interface ScanToolbarProps {
  totalCount: number
  filteredCount: number
  searchQuery: string
  onSearchChange: (q: string) => void
  sourceFilter: string | null
  onSourceFilterChange: (s: string | null) => void
  onClear: () => void
  entries: ScanEntry[]
}

const SOURCE_LABELS: Record<string, string> = {
  image: '图片',
  camera: '摄像头',
  scanner_gun: '扫码枪',
  multi: '多码',
  manual: '手动',
}

export function ScanToolbar({
  totalCount,
  filteredCount,
  searchQuery,
  onSearchChange,
  sourceFilter,
  onSourceFilterChange,
  onClear,
  entries,
}: ScanToolbarProps): JSX.Element {
  const [showFilters, setShowFilters] = useState(false)

  const sources = [...new Set(entries.map((e) => e.source))]

  const handleExportCSV = async () => {
    const csv =
      'text,format,source,timestamp\n' +
      entries
        .map(
          (e) =>
            `"${e.text.replace(/"/g, '""')}","${e.format}","${e.source}","${new Date(e.timestamp).toISOString()}"`,
        )
        .join('\n')

    const result = await window.api.file.saveDialog(`scan-workspace-${Date.now()}.csv`, [
      { name: 'CSV', extensions: ['csv'] },
    ])
    if (result.filePath) {
      await window.api.file.write(result.filePath, csv)
      toast({ type: 'success', title: `已导出 ${entries.length} 条记录` })
    }
  }

  const handleExportTXT = async () => {
    const txt = entries.map((e) => e.text).join('\n')
    const result = await window.api.file.saveDialog(`scan-workspace-${Date.now()}.txt`, [
      { name: 'Text', extensions: ['txt'] },
    ])
    if (result.filePath) {
      await window.api.file.write(result.filePath, txt)
      toast({ type: 'success', title: `已导出 ${entries.length} 条记录` })
    }
  }

  return (
    <div className="space-y-3">
      {/* Search + Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索扫描记录..."
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={sourceFilter ? 'text-brand-primary' : ''}
        >
          <Filter className="w-4 h-4 mr-1" />
          筛选
          {sourceFilter && (
            <span className="ml-1 w-2 h-2 rounded-full bg-brand-primary" />
          )}
        </Button>

        <div className="flex-1" />

        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={entries.length === 0}>
          <Download className="w-3 h-3 mr-1" /> CSV
        </Button>

        <Button variant="outline" size="sm" onClick={handleExportTXT} disabled={entries.length === 0}>
          <Download className="w-3 h-3 mr-1" /> TXT
        </Button>

        <Button variant="ghost" size="sm" onClick={onClear} disabled={entries.length === 0}>
          <Trash2 className="w-3 h-3 mr-1 text-brand-danger" />
          清空
        </Button>
      </div>

      {/* Source filters */}
      {showFilters && sources.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-brand-text-muted">来源:</span>
          <button
            onClick={() => onSourceFilterChange(null)}
            className={`px-2 py-0.5 rounded text-xs transition-colors ${
              !sourceFilter
                ? 'bg-brand-primary/10 text-brand-primary'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            全部
          </button>
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => onSourceFilterChange(s)}
              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                sourceFilter === s
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              {SOURCE_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <div className="text-xs text-brand-text-muted">
        {searchQuery || sourceFilter ? (
          <>
            显示 {filteredCount} / 共 {totalCount} 条
          </>
        ) : (
          <>共 {totalCount} 条</>
        )}
      </div>
    </div>
  )
}
