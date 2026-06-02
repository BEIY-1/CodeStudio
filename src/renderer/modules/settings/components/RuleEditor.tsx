import { useState } from 'react'
import { X, Plus, Globe, Tag, Volume2, Database, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Rule, ActionType } from '@/stores/rules-store'

interface RuleEditorProps {
  rule?: Rule | null
  onSave: (rule: Omit<Rule, 'id' | 'createdAt'>) => void
  onCancel: () => void
}

const ACTION_OPTIONS: { value: ActionType; label: string; icon: typeof Tag }[] = [
  { value: 'tag', label: '添加标签', icon: Tag },
  { value: 'highlight', label: '高亮显示', icon: Globe },
  { value: 'sound', label: '播放声音', icon: Volume2 },
  { value: 'save_db', label: '保存数据库', icon: Database },
  { value: 'export_csv', label: '导出 CSV', icon: Download },
  { value: 'webhook', label: '调用 Webhook', icon: Globe },
]

const ACTION_CONFIG_PLACEHOLDERS: Record<ActionType, string> = {
  tag: '{"tag":"标签名"}',
  highlight: '{}',
  sound: '{}',
  save_db: '{}',
  export_csv: '{}',
  webhook: '{"url":"https://example.com/webhook"}',
}

export function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps): JSX.Element {
  const [name, setName] = useState(rule?.name ?? '')
  const [pattern, setPattern] = useState(rule?.pattern ?? '')
  const [category, setCategory] = useState(rule?.category ?? '')
  const [actionType, setActionType] = useState<ActionType>(rule?.actionType ?? 'tag')
  const [actionConfig, setActionConfig] = useState(rule?.actionConfig ?? '{}')

  const handleSave = () => {
    if (!name.trim() || !pattern.trim()) return
    onSave({
      name: name.trim(),
      pattern: pattern.trim(),
      category: category.trim(),
      actionType,
      actionConfig,
      enabled: rule?.enabled ?? true,
      sortOrder: rule?.sortOrder ?? 0,
    })
  }

  const testPattern = (): boolean => {
    if (!pattern.trim()) return false
    // Test if the pattern has at least one wildcard or alphanumeric
    return /^[\w.*\-]+$/.test(pattern)
  }

  return (
    <Card className="bg-brand-bg border-brand-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-display">
          {rule ? '编辑规则' : '新建规则'}
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">
              规则名称
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 资产标签"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">
              匹配模式
            </label>
            <Input
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="例如: A* (支持通配符*)"
              className={cn('font-mono', pattern && !testPattern() && 'border-brand-danger')}
            />
            <p className="text-xs text-brand-text-muted mt-1">
              使用 <code className="text-brand-accent">*</code> 匹配任意字符
            </p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">
            分类标签
          </label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例如: 资产、设备、订单"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">
            动作类型
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ACTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActionType(opt.value)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all border',
                  actionType === opt.value
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-brand-border text-brand-text-secondary hover:border-brand-border-hover',
                )}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">
            动作配置 (JSON)
          </label>
          <textarea
            value={actionConfig}
            onChange={(e) => setActionConfig(e.target.value)}
            rows={2}
            placeholder={ACTION_CONFIG_PLACEHOLDERS[actionType]}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-1.5 text-xs text-brand-text-primary placeholder:text-brand-text-muted font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || !pattern.trim()}>
            <Plus className="w-4 h-4 mr-1" />
            {rule ? '保存' : '添加规则'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
