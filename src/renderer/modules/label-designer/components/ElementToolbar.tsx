import { useState, useRef, useCallback } from 'react'
import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { Image, QrCode, Type, Barcode, Download, X, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useLabelStore } from '../store'

type AddDialog = null | { type: 'qr' } | { type: 'barcode' }

export function ElementToolbar(): JSX.Element {
  const { addElement, canvasWidth, canvasHeight, elements } = useLabelStore()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<AddDialog>(null)
  const [inputValue, setInputValue] = useState('')
  const [barcodeFmt, setBarcodeFmt] = useState('CODE128')
  const [useEncryption, setUseEncryption] = useState(false)
  const [encPassword, setEncPassword] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addText = useCallback(() => {
    addElement({
      type: 'text',
      x: Math.round(canvasWidth / 2 - 60),
      y: Math.round(canvasHeight / 2 - 15),
      width: 120,
      height: 30,
      rotation: 0,
      textContent: '文本',
      fontSize: 14,
      fontColor: '#000000',
      fontFamily: 'sans-serif',
    })
  }, [addElement, canvasWidth, canvasHeight])

  const openQrDialog = useCallback(() => {
    setDialog({ type: 'qr' })
    setInputValue('')
    setUseEncryption(false)
    setEncPassword('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const openBarcodeDialog = useCallback(() => {
    setDialog({ type: 'barcode' })
    setInputValue('')
    setBarcodeFmt('CODE128')
    setUseEncryption(false)
    setEncPassword('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const confirmDialog = useCallback(() => {
    if (!inputValue.trim()) return
    if (dialog?.type === 'qr') {
      const size = 100
      addElement({
        type: 'qr',
        x: Math.round(canvasWidth / 2 - size / 2),
        y: Math.round(canvasHeight / 2 - size / 2),
        width: size,
        height: size,
        rotation: 0,
        qrContent: inputValue.trim(),
        encrypted: useEncryption,
        encPassword: useEncryption ? encPassword : undefined,
      })
    } else if (dialog?.type === 'barcode') {
      addElement({
        type: 'barcode',
        x: Math.round(canvasWidth / 2 - 120),
        y: Math.round(canvasHeight / 2 - 25),
        width: 240,
        height: 50,
        rotation: 0,
        barcodeContent: inputValue.trim(),
        barcodeFormat: barcodeFmt,
        encrypted: useEncryption,
        encPassword: useEncryption ? encPassword : undefined,
      })
    }
    setDialog(null)
    setInputValue('')
    setUseEncryption(false)
    setEncPassword('')
  }, [dialog, inputValue, barcodeFmt, useEncryption, encPassword, addElement, canvasWidth, canvasHeight])

  const closeDialog = useCallback(() => {
    setDialog(null)
    setInputValue('')
    setUseEncryption(false)
    setEncPassword('')
  }, [])

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const img = new window.Image()
        img.onload = () => {
          const maxDim = 200
          const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1)
          const w = Math.round(img.width * ratio)
          const h = Math.round(img.height * ratio)
          addElement({
            type: 'image',
            x: Math.round(canvasWidth / 2 - w / 2),
            y: Math.round(canvasHeight / 2 - h / 2),
            width: w,
            height: h,
            rotation: 0,
            imageDataUrl: dataUrl,
          })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
      e.target.value = ''
    },
    [addElement, canvasWidth, canvasHeight],
  )

  const handleExport = useCallback(async () => {
    const { elements, canvasWidth, canvasHeight } = useLabelStore.getState()
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex)
    for (const el of sorted) {
      ctx.save()
      if (el.rotation) {
        const cx = el.x + el.width / 2
        const cy = el.y + el.height / 2
        ctx.translate(cx, cy)
        ctx.rotate((el.rotation * Math.PI) / 180)
        ctx.translate(-cx, -cy)
      }

      try {
        if (el.type === 'image' && el.imageDataUrl) {
          const img = await loadImage(el.imageDataUrl)
          ctx.drawImage(img, el.x, el.y, el.width, el.height)
        } else if (el.type === 'qr' && el.qrContent) {
          let content = el.qrContent
          if (el.encrypted && el.encPassword) {
            const { encrypt } = await import('@/utils/crypto')
            content = await encrypt(content, el.encPassword)
          }
          const qrCanvas = await renderQrToCanvas(content, el.width)
          ctx.drawImage(qrCanvas, el.x, el.y, el.width, el.height)
        } else if (el.type === 'text') {
          ctx.fillStyle = el.fontColor ?? '#000000'
          const fontSize = el.fontSize ?? 14
          ctx.font = `${fontSize}px ${el.fontFamily ?? 'sans-serif'}`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(el.textContent || '', el.x + el.width / 2, el.y + el.height / 2)
        } else if (el.type === 'barcode' && el.barcodeContent) {
          let content = el.barcodeContent
          let format = el.barcodeFormat ?? 'CODE128'
          if (el.encrypted && el.encPassword) {
            const { encrypt } = await import('@/utils/crypto')
            content = await encrypt(content, el.encPassword)
            format = 'CODE128' // encrypted data forces CODE128
          }
          const bcCanvas = await renderBarcodeToCanvas(content, format, el.width, el.height)
          ctx.drawImage(bcCanvas, el.x, el.y, el.width, el.height)
        }
      } catch {
        // Skip elements that fail to render
      }

      ctx.restore()
    }

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.split(',')[1]
    if (!base64) return
    const saveResult = await window.api.file.saveDialog('label.png', [
      { name: 'PNG Image', extensions: ['png'] },
    ])
    if (saveResult.filePath) {
      await window.api.file.write(saveResult.filePath, base64, 'base64')
      toast({ type: 'success', title: '标签已导出' })
    }
  }, [])

  const hasElements = elements.length > 0

  return (
    <>
      <div className="flex items-center gap-2">
        <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
          <Image className="w-4 h-4 mr-1.5" /> 图片
        </Button>
        <Button variant="outline" size="sm" onClick={openQrDialog}>
          <QrCode className="w-4 h-4 mr-1.5" /> 二维码
        </Button>
        <Button variant="outline" size="sm" onClick={addText}>
          <Type className="w-4 h-4 mr-1.5" /> 文本
        </Button>
        <Button variant="outline" size="sm" onClick={openBarcodeDialog}>
          <Barcode className="w-4 h-4 mr-1.5" /> 条码
        </Button>
        <div className="w-px h-6 bg-brand-border mx-1" />
        <Button size="sm" onClick={handleExport} disabled={!hasElements}>
          <Download className="w-4 h-4 mr-1.5" /> 导出 PNG
        </Button>
      </div>

      {/* Input dialog overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeDialog}>
          <div
            className="bg-brand-surface border border-brand-border rounded-xl p-5 w-80 space-y-4 shadow-xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-text-primary">
                {dialog.type === 'qr' ? '添加二维码' : '添加条码'}
              </h3>
              <button onClick={closeDialog} className="text-brand-text-muted hover:text-brand-text-primary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content input */}
            <div>
              <label className="text-xs text-brand-text-muted block mb-1">
                {dialog.type === 'qr' ? '二维码内容' : '条码内容'}
              </label>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !useEncryption) confirmDialog()
                }}
                placeholder={dialog.type === 'qr' ? '输入文本或 URL...' : '仅支持 ASCII 字符'}
                className="w-full rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* Barcode format */}
            {dialog.type === 'barcode' && !useEncryption && (
              <div>
                <label className="text-xs text-brand-text-muted block mb-1">条码格式</label>
                <select
                  value={barcodeFmt}
                  onChange={(e) => setBarcodeFmt(e.target.value)}
                  className="w-full rounded border border-brand-border bg-brand-bg px-2 py-1.5 text-sm text-brand-text-primary focus:outline-none"
                >
                  <option value="CODE128">Code128</option>
                  <option value="CODE39">Code39</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="EAN8">EAN-8</option>
                  <option value="UPC">UPC</option>
                </select>
              </div>
            )}

            {/* Encryption toggle */}
            <div className="border-t border-brand-border pt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEncryption}
                  onChange={(e) => {
                    setUseEncryption(e.target.checked)
                    if (e.target.checked && dialog.type === 'barcode') {
                      setBarcodeFmt('CODE128')
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-brand-border rounded-full peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative" />
                <span className="text-xs text-brand-text-secondary flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  AES-256-GCM 加密
                </span>
              </label>

              {useEncryption && (
                <div className="mt-2">
                  <input
                    type="password"
                    value={encPassword}
                    onChange={(e) => setEncPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && encPassword) confirmDialog()
                    }}
                    placeholder="输入加密密码..."
                    className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  {dialog.type === 'barcode' && (
                    <p className="text-[10px] text-brand-text-muted mt-1">
                      加密后自动使用 Code128 格式
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={closeDialog}
                className="px-3 py-1.5 text-xs rounded-md text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDialog}
                disabled={!inputValue.trim() || (useEncryption && !encPassword)}
                className="px-3 py-1.5 text-xs rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-40 transition-colors"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

async function renderQrToCanvas(content: string, size: number): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  await toCanvas(canvas, content, {
    width: size,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#FFFFFF' },
    margin: 0,
  })
  return canvas
}

async function renderBarcodeToCanvas(
  content: string,
  format: string,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  JsBarcode(svg, content, {
    format,
    width: 1,
    height: height > 0 ? height : 40,
    displayValue: false,
    background: '#FFFFFF',
    lineColor: '#000000',
    margin: 4,
  })
  const svgData = new XMLSerializer().serializeToString(svg)
  const dataUrl = 'data:image/svg+xml;base64,' + btoa(svgData)
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  return canvas
}
