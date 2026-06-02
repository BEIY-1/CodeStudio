import { useState } from 'react'
import { Braces, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface TemplateEditorProps {
  columns: string[]
  template: string
  onChange: (template: string) => void
}

const DEFAULT_TEMPLATE = '{"id": "{id}"}'

export function TemplateEditor({ columns, template, onChange }: TemplateEditorProps): JSX.Element {
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({})

  const variables = columns.map((c) => `{${c}}`)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-text-secondary">
            <Braces className="w-4 h-4 text-brand-accent" />
            输出模板
          </CardTitle>
          <CardDescription>使用 {`{列名}`} 作为变量占位符</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={template}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
            placeholder={DEFAULT_TEMPLATE}
          />

          {/* Variable chips */}
          {columns.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {variables.map((v) => (
                <button
                  key={v}
                  onClick={() => onChange(template + v)}
                  className="px-2 py-0.5 rounded text-xs font-mono bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 transition-colors"
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {columns.length > 0 && template && (
        <Card className="bg-brand-bg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-brand-text-muted" />
              <span className="text-xs text-brand-text-muted">模板预览</span>
            </div>
            <div className="flex gap-3">
              {columns.slice(0, 3).map((col) => (
                <div key={col} className="flex-1">
                  <label className="text-xs text-brand-text-muted mb-1 block">{col}</label>
                  <input
                    value={previewVars[col] ?? ''}
                    onChange={(e) =>
                      setPreviewVars((prev) => ({ ...prev, [col]: e.target.value }))
                    }
                    placeholder={`值: ${col}`}
                    className="w-full rounded border border-brand-border bg-brand-surface px-2 py-1 text-xs font-mono text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-brand-border">
              <span className="text-xs text-brand-text-muted">输出: </span>
              <code className="text-xs font-mono text-brand-accent">
                {template.replace(/\{(\w+)\}/g, (_m, key: string) => previewVars[key] ?? `{${key}}`)}
              </code>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
