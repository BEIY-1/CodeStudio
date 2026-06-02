import { useState, useRef, useCallback } from 'react'
import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { Image, QrCode, Type, Barcode, Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { useLabelStore } from '../store'

type AddDialog = null | { type: 'qr' } | { type: 'barcode' }

export function ElementToolbar(): JSX.Element {
  const { addElement, canvasWidth, canvasHeight } = useLabelStore()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<AddDialog>(null)
  const [inputValue, setInputValue] = useState('')
  const [barcodeFmt, setBarcodeFmt] = useState('CODE128')
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
    })
  }, [addElement, canvasWidth, canvasHeight])

  const openQrDialog = useCallback(() => {
    setDialog({ type: 'qr' })
    setInputValue('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const openBarcodeDialog = useCallback(() => {
    setDialog({ type: 'barcode' })
    setInputValue('')
    setBarcodeFmt('CODE128')
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
      })
    }
    setDialog(null)
    setInputValue('')
  }, [dialog, inputValue, barcodeFmt, addElement, canvasWidth, canvasHeight])

  const closeDialog = useCallback(() => {
    setDialog(null)
    setInputValue('')
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
          const qrCanvas = await renderQrToCanvas(el.qrContent, el.width)
          ctx.drawImage(qrCanvas, el.x, el.y, el.width, el.height)
        } else if (el.type === 'text') {
          ctx.fillStyle = el.fontColor ?? '#000000'
          const fontSize = el.fontSize ?? 14
          ctx.font = `${fontSize}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(el.textContent || '', el.x + el.width / 2, el.y + el.height / 2)
        } else if (el.type === 'barcode' && el.barcodeContent) {
          const bcCanvas = await renderBarcodeToCanvas(el.barcodeContent, el.barcodeFormat ?? 'CODE128', el.width, el.height)
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
        <Button size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" /> 导出 PNG
        </Button>
      </div>

      {/* Input dialog overlay */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={closeDialog}>
          <div
            className="bg-brand-surface border border-brand-border rounded-xl p-5 w-80 space-y-4 shadow-xl"
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
            <div>
              <label className="text-xs text-brand-text-muted block mb-1">
                {dialog.type === 'qr' ? '二维码内容' : '条码内容'}
              </label>
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmDialog() }}
                placeholder={dialog.type === 'qr' ? '输入文本或 URL...' : '仅支持 ASCII 字符'}
                className="w-full rounded border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            {dialog.type === 'barcode' && (
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
            <div className="flex gap-2 justify-end">
              <button onClick={closeDialog}
                className="px-3 py-1.5 text-xs rounded-md text-brand-text-secondary hover:text-brand-text-primary transition-colors">
                取消
              </button>
              <button onClick={confirmDialog} disabled={!inputValue.trim()}
                className="px-3 py-1.5 text-xs rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 disabled:opacity-40 transition-colors">
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
