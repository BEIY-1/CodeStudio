import { useState, useCallback } from 'react'
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, ShieldX, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { decrypt, isEncryptedPayload } from '@/utils/crypto'
import { copyText } from '@/lib/clipboard'

export function EncryptedDecoder(): JSX.Element {
  const [encryptedData, setEncryptedData] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isValidEncrypted = isEncryptedPayload(encryptedData)

  const handleDecrypt = useCallback(async () => {
    if (!encryptedData.trim() || !password.trim()) return
    setIsDecrypting(true)
    setErrorMsg(null)
    setDecrypted(null)

    try {
      const result = await decrypt(encryptedData, password)
      setDecrypted(result)
      toast({ type: 'success', title: '解密成功' })
    } catch (err) {
      const msg = err instanceof Error ? err.message : '解密失败'
      setErrorMsg(msg)
      toast({ type: 'error', title: '解密失败', description: msg })
    } finally {
      setIsDecrypting(false)
    }
  }, [encryptedData, password])

  const copyDecrypted = useCallback(async () => {
    if (!decrypted) return
    const ok = await copyText(decrypted)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      toast({ type: 'error', title: '复制失败' })
    }
  }, [decrypted])

  return (
    <div className="grid grid-cols-2 gap-8">
      {/* Left: Input */}
      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
            加密数据（从加密二维码扫描获取）
          </label>
          <textarea
            value={encryptedData}
            onChange={(e) => {
              setEncryptedData(e.target.value)
              setDecrypted(null)
              setErrorMsg(null)
            }}
            placeholder='粘贴加密二维码的解码内容，格式: {"v":1,"s":"...","i":"...","d":"..."}'
            rows={6}
            className="w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-xs text-brand-text-primary placeholder:text-brand-text-muted font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />

          {/* Validation indicator */}
          {encryptedData && (
            <div
              className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                isValidEncrypted ? 'text-brand-success' : 'text-brand-danger'
              }`}
            >
              {isValidEncrypted ? (
                <>
                  <ShieldCheck className="w-3 h-3" /> 有效的加密格式
                </>
              ) : (
                <>
                  <ShieldX className="w-3 h-3" /> 不是有效的加密数据
                </>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">
            解密密码
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入加密时设置的密码..."
              className="pr-10 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDecrypt()
              }}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleDecrypt}
          disabled={!isValidEncrypted || !password.trim() || isDecrypting}
          className="w-full"
        >
          {isDecrypting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              解密中...
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 mr-2" /> 解密
            </>
          )}
        </Button>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-brand-danger/10 border border-brand-danger/30 text-sm text-brand-danger flex items-center gap-2">
            <ShieldX className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Right: Result */}
      <Card className="bg-brand-surface/50 h-fit">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-text-secondary">
              {decrypted ? (
                <Unlock className="w-4 h-4 text-brand-success" />
              ) : (
                <Lock className="w-4 h-4 text-brand-text-muted" />
              )}
              解密结果
            </CardTitle>
            {decrypted && (
              <Button variant="ghost" size="icon" onClick={copyDecrypted}>
                {copied ? (
                  <Check className="w-4 h-4 text-brand-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
          <CardDescription>
            {decrypted ? '解密成功' : '等待输入密码解密'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[200px] p-4 rounded-lg bg-brand-bg border border-brand-border">
            {decrypted ? (
              <pre className="text-sm font-mono text-brand-text-primary whitespace-pre-wrap break-all">
                {decrypted}
              </pre>
            ) : (
              <p className="text-sm text-brand-text-muted text-center pt-16">
                {isDecrypting ? '正在解密...' : '输入加密数据和密码'}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
