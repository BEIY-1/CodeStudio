import { useState } from 'react'
import { Edit, Trash2, ToggleLeft, ToggleRight, GripVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { useRulesStore, getActionLabel, type Rule } from '@/stores/rules-store'
import { RuleEditor } from './RuleEditor'

export function RuleList(): JSX.Element {
  const { rules, addRule, updateRule, removeRule, toggleRule } = useRulesStore()
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  const handleSave = (ruleData: Omit<Rule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      updateRule(editingRule.id, ruleData)
      toast({ type: 'success', title: '规则已更新' })
    } else {
      addRule(ruleData)
      toast({ type: 'success', title: '规则已添加' })
    }
    setShowEditor(false)
    setEditingRule(null)
  }

  const handleDelete = (rule: Rule) => {
    removeRule(rule.id)
    toast({ type: 'success', title: `已删除规则: ${rule.name}` })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-text-secondary">
          {rules.length} 条规则 · 扫码后自动匹配并执行动作
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingRule(null)
            setShowEditor(true)
          }}
        >
          <Plus className="w-3 h-3 mr-1" /> 添加规则
        </Button>
      </div>

      {showEditor && (
        <RuleEditor
          rule={editingRule}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false)
            setEditingRule(null)
          }}
        />
      )}

      <Card>
        <CardContent className="p-0 divide-y divide-brand-border">
          {rules.length === 0 ? (
            <div className="p-8 text-center text-sm text-brand-text-muted">
              暂无规则，点击「添加规则」创建第一条
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-brand-hover transition-colors group"
              >
                <GripVertical className="w-4 h-4 text-brand-text-muted opacity-30" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-text-primary">
                      {rule.name}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${rule.enabled ? 'bg-brand-success' : 'bg-brand-text-muted'}`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs font-mono text-brand-accent bg-brand-accent/5 px-1 rounded">
                      {rule.pattern}
                    </code>
                    <span className="text-xs text-brand-text-muted">
                      → {rule.category} · {getActionLabel(rule.actionType)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleRule(rule.id)}
                  className="text-brand-text-muted hover:text-brand-text-primary transition-colors"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-5 h-5 text-brand-primary" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>

                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingRule(rule)
                      setShowEditor(true)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleDelete(rule)}
                  >
                    <Trash2 className="w-3 h-3 text-brand-danger" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
