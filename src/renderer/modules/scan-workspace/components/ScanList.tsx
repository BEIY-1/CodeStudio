import { useState } from 'react'
import { Copy, Check, Trash2, Tag, Clock, ScanLine, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { formatTimestamp } from '@/lib/utils'
import type { ScanEntry } from '@/stores/scan-store'
import { useScanStore } from '@/stores/scan-store'
import { useRulesStore, matchRules } from '@/stores/rules-store'
import { copyText } from '@/lib/clipboard'

interface ScanListProps {
  entries: ScanEntry[]
  dedupe: boolean
  showTimestamps: boolean
}

const SOURCE_ICONS: Record<string, string> = {
  image: '📷',
  camera: '📹',
  scanner_gun: '🔫',
  multi: '🔢',
  manual: '⌨',
}

export function ScanList({ entries, dedupe, showTimestamps }: ScanListProps): JSX.Element {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [tagInputId, setTagInputId] = useState<string | null>(null)
  const [tagValue, setTagValue] = useState('')
  const { removeEntry, addTag, removeTag } = useScanStore()
  const rules = useRulesStore((s) => s.rules)

  const displayedEntries = dedupe
    ? entries.filter((e, i, arr) => arr.findIndex((x) => x.text === e.text) === i)
    : entries

  const copyToClipboard = async (text: string, id: string) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }

  const handleAddTag = (id: string) => {
    if (tagValue.trim()) {
      addTag(id, tagValue.trim())
      setTagValue('')
      setTagInputId(null)
    }
  }

  if (displayedEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-brand-text-muted">
        <ScanLine className="w-20 h-20 mb-4 opacity-10" />
        <p className="text-lg font-display">等待扫描输入</p>
        <p className="text-sm mt-1">使用图片识别、摄像头、扫码枪获取数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {displayedEntries.map((entry, idx) => (
        <div
          key={entry.id}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-brand-hover transition-colors group border border-transparent hover:border-brand-border"
        >
          {/* Index */}
          <span className="text-xs text-brand-text-muted font-mono w-8 shrink-0 tabular-nums">
            #{displayedEntries.length - idx}
          </span>

          {/* Source icon */}
          <span className="text-xs shrink-0 w-6 text-center" title={entry.source}>
            {SOURCE_ICONS[entry.source] ?? '📋'}
          </span>

          {/* Format badge */}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-mono shrink-0">
            {entry.format}
          </span>

          {/* Text */}
          <span className="flex-1 text-sm font-mono text-brand-text-primary truncate">
            {entry.text}
          </span>

          {/* Rule matches */}
          {matchRules(entry.text, rules).slice(0, 2).map((rule) => (
            <span
              key={rule.id}
              className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent font-medium flex items-center gap-0.5"
              title={`匹配规则: ${rule.name} → ${rule.category}`}
            >
              <Zap className="w-2.5 h-2.5" />
              {rule.category}
            </span>
          ))}

          {/* Tags */}
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-brand-accent/10 text-brand-accent cursor-pointer hover:bg-brand-accent/20"
              onClick={() => removeTag(entry.id, tag)}
              title="点击移除标签"
            >
              {tag} ×
            </span>
          ))}

          {/* Add tag */}
          {tagInputId === entry.id ? (
            <input
              autoFocus
              value={tagValue}
              onChange={(e) => setTagValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTag(entry.id)
                if (e.key === 'Escape') setTagInputId(null)
              }}
              onBlur={() => {
                if (tagValue.trim()) handleAddTag(entry.id)
                else setTagInputId(null)
              }}
              className="w-20 h-6 text-xs rounded border border-brand-border bg-brand-bg px-1.5 text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              placeholder="标签"
            />
          ) : (
            <button
              onClick={() => setTagInputId(entry.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-text-muted hover:text-brand-text-primary"
            >
              <Tag className="w-3 h-3" />
            </button>
          )}

          {/* Timestamp */}
          {showTimestamps && (
            <span className="text-xs text-brand-text-muted font-mono shrink-0 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimestamp(entry.timestamp)}
            </span>
          )}

          {/* Actions */}
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => copyToClipboard(entry.text, entry.id)}
            >
              {copiedId === entry.id ? (
                <Check className="w-3 h-3 text-brand-success" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => removeEntry(entry.id)}
            >
              <Trash2 className="w-3 h-3 text-brand-text-muted hover:text-brand-danger" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
