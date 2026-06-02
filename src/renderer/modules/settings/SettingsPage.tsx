import { useState } from 'react'
import { Settings, Wrench, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useSettingsStore } from '@/stores/settings-store'
import { RuleList } from './components/RuleList'
import { SignatureTools } from './components/SignatureTools'
import { cn } from '@/lib/utils'

type SettingsTab = 'general' | 'rules' | 'signature'

export default function SettingsPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const { defaultExportFormat, autoSave, setDefaultExportFormat, setAutoSave } =
    useSettingsStore()

  return (
    <div className="h-full p-8 max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-brand-text-primary mb-2">设置</h1>
      <p className="text-brand-text-secondary mb-6">应用偏好 · 规则引擎 · 数字签名</p>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-brand-surface rounded-lg p-1 w-fit border border-brand-border">
        <button
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'general'
              ? 'bg-brand-primary/10 text-brand-primary'
              : 'text-brand-text-secondary hover:text-brand-text-primary',
          )}
        >
          <Settings className="w-4 h-4" /> 通用
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'rules'
              ? 'bg-brand-accent/10 text-brand-accent'
              : 'text-brand-text-secondary hover:text-brand-text-primary',
          )}
        >
          <Wrench className="w-4 h-4" /> 规则引擎
        </button>
        <button
          onClick={() => setActiveTab('signature')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'signature'
              ? 'bg-brand-success/10 text-brand-success'
              : 'text-brand-text-secondary hover:text-brand-text-primary',
          )}
        >
          <Shield className="w-4 h-4" /> 数字签名
        </button>
      </div>

      {/* Content */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">默认导出格式</CardTitle>
              <CardDescription>生成二维码时的默认导出格式</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {(['PNG', 'SVG', 'PDF'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDefaultExportFormat(fmt)}
                    className={`px-4 py-1.5 rounded-md text-sm border transition-colors ${
                      defaultExportFormat === fmt
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-brand-border text-brand-text-secondary hover:border-brand-border-hover'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">自动保存</CardTitle>
              <CardDescription>崩溃恢复时自动恢复未保存的工作</CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSave ? 'bg-brand-primary' : 'bg-brand-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSave ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'rules' && <RuleList />}
      {activeTab === 'signature' && <SignatureTools />}
    </div>
  )
}
