import { useState, useCallback } from 'react'
import { toCanvas } from 'qrcode'
import {
  Key,
  FileSignature,
  ShieldCheck,
  ShieldX,
  Copy,
  Check,
  Download,
  RefreshCw,
  QrCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { copyText } from '@/lib/clipboard'
import {
  generateKeyPair,
  createSignedPayload,
  verifySignedPayload,
  type KeyPair,
} from '@/utils/signature'

export function SignatureTools(): JSX.Element {
  const [keys, setKeys] = useState<KeyPair | null>(null)
  const [signData, setSignData] = useState('')
  const [signedPayload, setSignedPayload] = useState<string | null>(null)
  const [verifyPayload, setVerifyPayload] = useState('')
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean
    data?: string
    error?: string
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const canvasRef = useCallback(
    async (canvas: HTMLCanvasElement | null) => {
      if (!canvas || !signedPayload) return
      await toCanvas(canvas, signedPayload, {
        width: 300,
        errorCorrectionLevel: 'H',
        color: { dark: '#F1F5F9', light: '#0B0F14' },
        margin: 2,
      })
    },
    [signedPayload],
  )

  const handleGenerateKeys = async () => {
    try {
      const kp = await generateKeyPair()
      setKeys(kp)
      setSignedPayload(null)
      toast({ type: 'success', title: '密钥对已生成 (ECDSA P-256)' })
    } catch (err) {
      toast({ type: 'error', title: '密钥生成失败', description: String(err) })
    }
  }

  const handleSign = async () => {
    if (!keys || !signData.trim()) return
    try {
      const payload = await createSignedPayload(signData, keys.privateKey, keys.publicKey)
      setSignedPayload(payload)
      toast({ type: 'success', title: '签名完成' })
    } catch (err) {
      toast({ type: 'error', title: '签名失败', description: String(err) })
    }
  }

  const handleVerify = async () => {
    if (!verifyPayload.trim()) return
    try {
      const result = await verifySignedPayload(verifyPayload)
      setVerifyResult(result)
      if (result.valid) {
        toast({ type: 'success', title: '✓ 验证通过 — 签名有效' })
      } else {
        toast({ type: 'warning', title: '✗ 验证失败', description: result.error })
      }
    } catch (err) {
      toast({ type: 'error', title: '验证出错', description: String(err) })
    }
  }

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyText(text)
    if (ok) {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Key Generation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="w-4 h-4 text-brand-accent" />
            密钥管理
          </CardTitle>
          <CardDescription>ECDSA P-256 密钥对，用于签名和验证</CardDescription>
        </CardHeader>
        <CardContent>
          {keys ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border">
                <p className="text-xs text-brand-text-muted mb-1">公钥 (可公开分享)</p>
                <code className="text-xs font-mono text-brand-text-primary break-all">
                  {JSON.stringify(keys.publicKey).substring(0, 80)}...
                </code>
              </div>
              <div className="p-3 rounded-lg bg-brand-bg border border-brand-border">
                <p className="text-xs text-brand-text-muted mb-1">私钥 (请妥善保管)</p>
                <code className="text-xs font-mono text-brand-text-primary break-all">
                  {JSON.stringify(keys.privateKey).substring(0, 80)}...
                </code>
              </div>
            </div>
          ) : (
            <p className="text-sm text-brand-text-muted">尚未生成密钥对</p>
          )}
          <Button onClick={handleGenerateKeys} variant="outline" className="mt-3 w-full">
            <RefreshCw className="w-4 h-4 mr-1" />
            {keys ? '重新生成' : '生成密钥对'}
          </Button>
        </CardContent>
      </Card>

      {/* Sign */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-brand-primary" />
            签名
          </CardTitle>
          <CardDescription>对数据进行数字签名并生成可验证的二维码</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={signData}
            onChange={(e) => setSignData(e.target.value)}
            placeholder='输入要签名的数据，例如: {"id":"A001","name":"Dell"}'
            className="font-mono"
          />
          <Button onClick={handleSign} disabled={!keys || !signData.trim()} className="w-full">
            <FileSignature className="w-4 h-4 mr-1" /> 签名并生成二维码
          </Button>

          {signedPayload && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-brand-bg border border-brand-success/30">
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck className="w-4 h-4 text-brand-success" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(signedPayload, 'sig')}
                  >
                    {copied === 'sig' ? (
                      <Check className="w-3 h-3 text-brand-success" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-center">
                  <canvas ref={canvasRef} className="rounded-lg" />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={async () => {
                  const c = document.querySelector('canvas')
                  if (c) {
                    const d = c.toDataURL('image/png')
                    const r = await window.api.file.saveDialog(`signed-qr-${Date.now()}.png`, [
                      { name: 'PNG', extensions: ['png'] },
                    ])
                    if (r.filePath) {
                      await window.api.file.write(r.filePath, d.split(',')[1]!, 'base64')
                      toast({ type: 'success', title: '已导出签名二维码' })
                    }
                  }
                }}
              >
                <Download className="w-3 h-3 mr-1" /> 导出签名二维码
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verify */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-success" />
            验证
          </CardTitle>
          <CardDescription>验证签名数据的完整性和真实性</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={verifyPayload}
            onChange={(e) => setVerifyPayload(e.target.value)}
            placeholder="粘贴签名数据（从签名二维码扫描获取）"
            rows={3}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <Button
            onClick={handleVerify}
            disabled={!verifyPayload.trim()}
            className="w-full"
            variant="outline"
          >
            <ShieldCheck className="w-4 h-4 mr-1" /> 验证签名
          </Button>

          {verifyResult && (
            <div
              className={`p-3 rounded-lg border flex items-center gap-2 ${
                verifyResult.valid
                  ? 'border-brand-success/30 bg-brand-success/5'
                  : 'border-brand-danger/30 bg-brand-danger/5'
              }`}
            >
              {verifyResult.valid ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-brand-success" />
                  <div>
                    <p className="text-sm font-medium text-brand-success">✓ 验证通过</p>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      数据完整，未被篡改
                    </p>
                    {verifyResult.data && (
                      <code className="text-xs font-mono text-brand-text-primary mt-1 block">
                        {verifyResult.data}
                      </code>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <ShieldX className="w-5 h-5 text-brand-danger" />
                  <div>
                    <p className="text-sm font-medium text-brand-danger">✗ 验证失败</p>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      {verifyResult.error}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
