import { useState, useCallback, useRef, useEffect } from 'react'
import JsBarcode from 'jsbarcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Barcode as BarcodeIcon, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { encrypt } from '@/utils/crypto'
import { exportBarcode, type ExportFormat } from '../utils/export'
import { cn } from '@/lib/utils'

type BarcodeType = 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC'

const BARCODE_TYPES: { value: BarcodeType; label: string }[] = [
  { value: 'CODE128', label: 'Code128' },
  { value: 'CODE39', label: 'Code39' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'EAN8', label: 'EAN-8' },
  { value: 'UPC', label: 'UPC' },
]

const PLACEHOLDERS: Record<BarcodeType, string> = {
  CODE128: '输入文本或数字，例如: CODE128TEST',
  CODE39: '输入文本 (A-Z, 0-9)，例如: ABC123',
  EAN13: '输入12位数字，例如: 5901234123457',
  EAN8: '输入7-8位数字，例如: 1234567',
  UPC: '输入11-12位数字，例如: 123456789012',
}

const VALIDATORS: Record<BarcodeType, (v: string) => boolean> = {
  CODE128: (v) => v.length > 0,
  CODE39: (v) => /^[A-Z0-9.\- $/+%]+$/i.test(v),
  EAN13: (v) => /^\d{12,13}$/.test(v),
  EAN8: (v) => /^\d{7,8}$/.test(v),
  UPC: (v) => /^\d{11,12}$/.test(v),
}

function hasChinese(text: string): boolean {
  return /[一-鿿]/.test(text)
}

export function BarcodeForm(): JSX.Element {
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('CODE128')
  const [content, setContent] = useState('')
  const [encrypted, setEncrypted] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showText, setShowText] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  const hasChineseChars = !encrypted && hasChinese(content)
  const encryptOnly = encrypted && barcodeType === 'CODE128'
  const typeForEncrypt = encryptOnly ? 'CODE128' : barcodeType
  const isValidInput = content.trim().length > 0 && VALIDATORS[barcodeType](content) && !hasChineseChars
  const canGenerate = encrypted ? (isValidInput && password.trim().length > 0) : isValidInput

  const generateBarcode = useCallback(async () => {
    if (!content.trim() || !containerRef.current) return
    if (encrypted && !password.trim()) return
    if (!encrypted && !isValidInput) return

    setIsEncrypting(true)
    try {
      let data = content
      if (encrypted) {
        data = await encrypt(content, password)
      }

      containerRef.current.innerHTML = ''
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      containerRef.current.appendChild(svg)

      const opts: Record<string, unknown> = {
        format: typeForEncrypt,
        width: encrypted ? 1 : 2,
        height: encrypted ? 80 : 100,
        displayValue: showText && data.length <= 120,
        background: '#0B0F14',
        lineColor: '#F1F5F9',
        textColor: '#94A3B8',
        fontSize: encrypted ? 10 : 14,
        margin: 10,
        font: 'JetBrains Mono',
      }

      JsBarcode(svg, data, opts)
      setHasGenerated(true)

      if (encrypted) {
        toast({ type: 'success', title: '加密条码已生成' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('Barcode generation failed:', err)
      toast({ type: 'error', title: '生成失败', description: msg })
    } finally {
      setIsEncrypting(false)
    }
  }, [content, password, encrypted, isValidInput, typeForEncrypt, showText])

  // Auto-generate
  useEffect(() => {
    if (!canGenerate) {
      setHasGenerated(false)
      return
    }
    const timer = setTimeout(generateBarcode, 400)
    return () => clearTimeout(timer)
  }, [content, password, barcodeType, encrypted, canGenerate, generateBarcode, showText])

  // Re-generate on type switch
  useEffect(() => {
    if (canGenerate) generateBarcode()
  }, [barcodeType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = useCallback((format: ExportFormat) => {
    if (!containerRef.current) return
    const svg = containerRef.current.querySelector('svg')
    if (!svg) return
    try {
      const prefix = encrypted ? 'encrypted-barcode' : 'barcode'
      exportBarcode(svg, format, `${prefix}-${Date.now()}`)
      toast({ type: 'success', title: `已导出为 ${format}` })
    } catch {
      toast({ type: 'error', title: '导出失败' })
    }
  }, [encrypted])

  return (
    <div className="grid grid-cols-2 gap-8 h-full">
      <div className="space-y-6">
        {/* Type selector */}
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
            条码类型
          </label>
          <div className="flex flex-wrap gap-2">
            {BARCODE_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setBarcodeType(t.value)}
                disabled={encrypted && t.value !== 'CODE128'}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm border transition-colors',
                  encrypted && t.value !== 'CODE128' && 'opacity-40 cursor-not-allowed',
                  barcodeType === t.value
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
            onChange={(e) => {
              setEncrypted(e.target.checked)
              if (e.target.checked) setBarcodeType('CODE128')
              setHasGenerated(false)
            }}
            className="accent-brand-primary w-4 h-4"
          />
          <Lock className="w-4 h-4 text-brand-accent" />
          <div>
            <p className="text-sm font-medium text-brand-text-primary">AES-256-GCM 加密</p>
            <p className="text-xs text-brand-text-secondary">条码内容加密，需密码才能解密读取</p>
          </div>
        </label>

        {/* Password (encrypted mode only) */}
        {encrypted && (
          <div>
            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
              加密密码
            </label>
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
            <p className="text-xs text-brand-text-muted mt-1">
              加密后数据较长，仅 Code128 支持。短内容建议用 QR Code 加密。
            </p>
          </div>
        )}

        {/* Content input */}
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
            {encrypted ? '要加密的内容' : '内容'}
          </label>
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={encrypted ? '输入需要加密的内容...' : PLACEHOLDERS[barcodeType]}
            className={`font-mono ${content && !isValidInput && !encrypted ? 'border-brand-danger' : ''}`}
          />
          {content && hasChineseChars && (
            <div className="p-3 mt-2 rounded-lg border border-brand-accent/30 bg-brand-accent/5 text-xs">
              <p className="font-medium text-brand-accent mb-1">条码不支持中文</p>
              <p>请切换到 <strong className="text-brand-primary">QR Code</strong> 标签页或开启加密模式。</p>
            </div>
          )}
          {content && !isValidInput && !hasChineseChars && !encrypted && (
            <p className="text-xs text-brand-danger mt-1">条码内容格式无效</p>
          )}
        </div>

        {/* Show text toggle */}
        <label className="flex items-center gap-2 text-sm text-brand-text-secondary cursor-pointer">
          <input type="checkbox" checked={showText} onChange={(e) => setShowText(e.target.checked)}
            className="accent-brand-primary w-4 h-4" />
          显示条码下方文字
        </label>

        <Button onClick={generateBarcode} disabled={!canGenerate || isEncrypting} className="w-full">
          <RefreshCw className={cn('w-4 h-4 mr-2', isEncrypting && 'animate-spin')} />
          {isEncrypting ? '生成中...' : encrypted ? '生成加密条码' : '生成条码'}
        </Button>

        {hasGenerated && (
          <div className="flex gap-2">
            {(['PNG', 'SVG', 'PDF'] as ExportFormat[]).map((fmt) => (
              <Button key={fmt} variant="outline" size="sm" onClick={() => handleExport(fmt)}>
                导出 {fmt}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center">
        <Card className="bg-brand-surface/50 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-text-secondary">
              {encrypted ? (
                <Lock className="w-4 h-4 text-brand-accent" />
              ) : (
                <BarcodeIcon className="w-4 h-4 text-brand-accent" />
              )}
              {encrypted ? '加密条码预览' : '预览'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[320px]">
            <div
              ref={containerRef}
              className="flex items-center justify-center w-full overflow-auto"
              style={{ maxHeight: '400px', display: hasGenerated ? 'flex' : 'none' }}
            />
            {!hasGenerated && (
              <div className="text-center text-brand-text-muted">
                <BarcodeIcon className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="text-sm">输入内容自动生成预览</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
