import { useState, useCallback, useRef } from 'react'
import { toCanvas } from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { encrypt } from '@/utils/crypto'
import { exportQRCode, type ExportFormat } from '../utils/export'
import { cn } from '@/lib/utils'

type QRType = 'text' | 'url' | 'email' | 'phone' | 'wifi' | 'json'

const QR_TYPES: { value: QRType; label: string; placeholder: string }[] = [
  { value: 'text', label: '文本', placeholder: '输入文本内容...' },
  { value: 'url', label: 'URL', placeholder: 'https://example.com' },
  { value: 'email', label: 'Email', placeholder: 'user@example.com' },
  { value: 'phone', label: '电话', placeholder: '+86 13800138000' },
  { value: 'wifi', label: 'WiFi', placeholder: 'WIFI:S:SSID;T:WPA;P:PASSWORD;;' },
  { value: 'json', label: 'JSON', placeholder: '{"key": "value"}' },
]

export function QRCodeForm(): JSX.Element {
  const [qrType, setQrType] = useState<QRType>('text')
  const [content, setContent] = useState('')
  const [size, setSize] = useState(256)
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [encrypted, setEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  const canGenerate = content.trim().length > 0 && (!encrypted || password.trim().length > 0)

  const generateQR = useCallback(async () => {
    if (!content.trim() || !canvasRef.current) return
    if (encrypted && !password.trim()) return
    setIsGenerating(true)
    try {
      let data = content
      if (encrypted) {
        data = await encrypt(content, password)
      }
      await toCanvas(canvasRef.current, data, {
        width: size,
        errorCorrectionLevel: encrypted ? 'H' : errorLevel,
        color: { dark: '#F1F5F9', light: '#0B0F14' },
        margin: 2,
      })
      setHasGenerated(true)
      if (encrypted) toast({ type: 'success', title: '加密二维码已生成' })
    } catch (err) {
      console.error('QR generation failed:', err)
      toast({ type: 'error', title: '生成失败', description: String(err) })
    } finally {
      setIsGenerating(false)
    }
  }, [content, size, errorLevel, encrypted, password])

  const handleExport = useCallback(
    (format: ExportFormat) => {
      if (!canvasRef.current) return
      try {
        const prefix = encrypted ? 'encrypted-qr' : 'qrcode'
        exportQRCode(canvasRef.current, format, `${prefix}-${Date.now()}`)
        toast({ type: 'success', title: `已导出为 ${format}` })
      } catch {
        toast({ type: 'error', title: '导出失败' })
      }
    },
    [encrypted],
  )

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        {/* Type selector */}
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">类型</label>
          <div className="flex flex-wrap gap-2">
            {QR_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => { setQrType(t.value); setHasGenerated(false) }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  qrType === t.value
                    ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                    : 'border-brand-border text-brand-text-secondary hover:border-brand-border-hover',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Encrypted toggle */}
        <label className="flex items-center gap-3 p-3 rounded-lg border border-brand-border cursor-pointer hover:border-brand-border-hover transition-colors">
          <input
            type="checkbox"
            checked={encrypted}
            onChange={(e) => { setEncrypted(e.target.checked); setHasGenerated(false) }}
            className="accent-brand-primary w-4 h-4"
          />
          <Lock className="w-4 h-4 text-brand-accent" />
          <div>
            <p className="text-sm font-medium text-brand-text-primary">AES-256-GCM 加密</p>
            <p className="text-xs text-brand-text-secondary">内容加密后生成，需密码才能解密</p>
          </div>
        </label>

        {/* Password */}
        {encrypted && (
          <div>
            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">加密密码</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="设置解密密码..."
                className="pr-10 font-mono"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
            {encrypted ? '要加密的内容' : '内容'}
          </label>
          {qrType === 'json' || encrypted ? (
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setHasGenerated(false) }}
              placeholder={encrypted ? '输入需要加密的内容...' : QR_TYPES.find((t) => t.value === qrType)?.placeholder}
              rows={6}
              className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary placeholder:text-brand-text-muted font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          ) : (
            <Input
              value={content}
              onChange={(e) => { setContent(e.target.value); setHasGenerated(false) }}
              placeholder={QR_TYPES.find((t) => t.value === qrType)?.placeholder}
              className="font-mono"
            />
          )}
        </div>

        {/* Size + Error */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">尺寸: {size}px</label>
            <input type="range" min="128" max="512" step="16" value={size}
              onChange={(e) => { setSize(Number(e.target.value)); setHasGenerated(false) }}
              className="w-full accent-brand-primary"
            />
          </div>
          {!encrypted && (
            <div>
              <label className="text-sm font-medium text-brand-text-secondary mb-2 block">容错</label>
              <select value={errorLevel}
                onChange={(e) => { setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H'); setHasGenerated(false) }}
                className="h-9 rounded-md border border-brand-border bg-brand-bg px-3 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="L">L - 7%</option>
                <option value="M">M - 15%</option>
                <option value="Q">Q - 25%</option>
                <option value="H">H - 30%</option>
              </select>
            </div>
          )}
        </div>

        <Button onClick={generateQR} disabled={!canGenerate || isGenerating} className="w-full">
          <RefreshCw className={cn('w-4 h-4 mr-2', isGenerating && 'animate-spin')} />
          {isGenerating ? '生成中...' : encrypted ? '生成加密二维码' : '生成二维码'}
        </Button>

        {hasGenerated && (
          <div className="flex gap-2">
            {(['PNG', 'SVG', 'PDF'] as ExportFormat[]).map((fmt) => (
              <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)}>导出 {fmt}</Button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center">
        <Card className="bg-brand-surface/50 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-text-secondary">
              {encrypted ? <Lock className="w-4 h-4 text-brand-accent" /> : <QrCode className="w-4 h-4 text-brand-primary" />}
              {encrypted ? '加密二维码预览' : '预览'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[320px]">
            <canvas ref={canvasRef} className="rounded-lg"
              style={{ maxWidth: '100%', maxHeight: '400px', display: hasGenerated ? 'block' : 'none' }}
            />
            {!hasGenerated && (
              <div className="text-center text-brand-text-muted">
                <QrCode className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">点击「生成二维码」查看预览</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
