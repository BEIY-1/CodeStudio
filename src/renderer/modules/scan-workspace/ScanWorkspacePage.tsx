import { useState, useMemo } from 'react'
import { Plus, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScanStore } from '@/stores/scan-store'
import { ScanToolbar } from './components/ScanToolbar'
import { ScanList } from './components/ScanList'

export default function ScanWorkspacePage(): JSX.Element {
  const { entries, addEntry, clearEntries } = useScanStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string | null>(null)
  const [dedupe, setDedupe] = useState(true)
  const [showTimestamps, setShowTimestamps] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)

  const filteredEntries = useMemo(() => {
    let result = entries

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.text.toLowerCase().includes(q) ||
          e.format.toLowerCase().includes(q) ||
          e.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }

    if (sourceFilter) {
      result = result.filter((e) => e.source === sourceFilter)
    }

    return result
  }, [entries, searchQuery, sourceFilter])

  const handleManualAdd = () => {
    if (manualInput.trim()) {
      addEntry(manualInput.trim(), 'text', 'manual')
      setManualInput('')
      setShowManualInput(false)
    }
  }

  return (
    <div className="h-full p-8 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-text-primary">
            扫码工作台
          </h1>
          <p className="mt-2 text-brand-text-secondary">
            去重 · 搜索 · 导出 · 时间戳 · 标签
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Manual entry */}
          {showManualInput && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualAdd()
                  if (e.key === 'Escape') setShowManualInput(false)
                }}
                placeholder="手动输入..."
                className="h-9 w-48 rounded-md border border-brand-border bg-brand-bg px-3 text-sm text-brand-text-primary placeholder:text-brand-text-muted font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              <Button size="sm" onClick={handleManualAdd}>添加</Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowManualInput(!showManualInput)}>
            <Plus className="w-4 h-4 mr-1" /> 手动添加
          </Button>

          {/* Toggles */}
          <button
            onClick={() => setDedupe(!dedupe)}
            className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            {dedupe ? (
              <ToggleRight className="w-5 h-5 text-brand-primary" />
            ) : (
              <ToggleLeft className="w-5 h-5" />
            )}
            去重
          </button>

          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className="flex items-center gap-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
          >
            <Clock className="w-4 h-4" />
            {showTimestamps ? '隐藏时间' : '显示时间'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <ScanToolbar
        totalCount={entries.length}
        filteredCount={filteredEntries.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onClear={clearEntries}
        entries={filteredEntries}
      />

      {/* Divider */}
      <hr className="my-4 border-brand-border" />

      {/* Scan list */}
      <div className="flex-1 overflow-y-auto">
        <ScanList entries={filteredEntries} dedupe={dedupe} showTimestamps={showTimestamps} />
      </div>
    </div>
  )
}
