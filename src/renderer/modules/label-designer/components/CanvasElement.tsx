import { useCallback, useState, useRef, useEffect } from 'react'
import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { cn } from '@/lib/utils'
import { useLabelStore, type LabelElement } from '../store'

interface Props {
  el: LabelElement
  scale: number
}

export function CanvasElement({ el, scale }: Props): JSX.Element {
  const { selectedId, selectElement, updateElement } = useLabelStore()
  const isSelected = selectedId === el.id
  const [dragging, setDragging] = useState<'move' | 'resize' | null>(null)
  const dragStart = useRef({ x: 0, y: 0, elX: 0, elY: 0, elW: 0, elH: 0 })

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: 'move' | 'resize') => {
      e.stopPropagation()
      e.preventDefault()
      selectElement(el.id)
      setDragging(mode)
      dragStart.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y, elW: el.width, elH: el.height }
    },
    [el, selectElement],
  )

  useEffect(() => {
    if (!dragging) return

    const handleMove = (e: MouseEvent) => {
      const dx = (e.clientX - dragStart.current.x) / scale
      const dy = (e.clientY - dragStart.current.y) / scale

      if (dragging === 'move') {
        updateElement(el.id, {
          x: Math.round(dragStart.current.elX + dx),
          y: Math.round(dragStart.current.elY + dy),
        })
      } else if (dragging === 'resize') {
        updateElement(el.id, {
          width: Math.max(20, Math.round(dragStart.current.elW + dx)),
          height: Math.max(20, Math.round(dragStart.current.elH + dy)),
        })
      }
    }

    const handleUp = () => setDragging(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, el.id, scale, updateElement])

  return (
    <div
      className={cn(
        'absolute group cursor-move select-none',
        isSelected && 'ring-2 ring-brand-primary ring-offset-1',
      )}
      style={{
        left: el.x * scale,
        top: el.y * scale,
        width: el.width * scale,
        height: el.height * scale,
        zIndex: el.zIndex,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Content */}
      <div className="w-full h-full overflow-hidden rounded-sm">
        {el.type === 'image' && el.imageDataUrl && (
          <img src={el.imageDataUrl} alt="" className="w-full h-full object-contain" draggable={false} />
        )}
        {el.type === 'qr' && el.qrContent && (
          <QrPreview content={el.qrContent} />
        )}
        {el.type === 'text' && (
          <div
            className="w-full h-full flex items-center justify-center px-1"
            style={{ fontSize: (el.fontSize ?? 14) * scale, color: el.fontColor ?? '#000' }}
          >
            {el.textContent || '文本'}
          </div>
        )}
        {el.type === 'barcode' && el.barcodeContent && (
          <BarcodePreview content={el.barcodeContent} format={el.barcodeFormat ?? 'CODE128'} />
        )}
      </div>

      {/* Resize handle (bottom-right corner) */}
      {isSelected && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-brand-primary rounded-full cursor-se-resize border-2 border-white"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
        />
      )}
    </div>
  )
}

// Mini QR preview using canvas
function QrPreview({ content }: { content: string }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    toCanvas(canvas, content, {
      width: 200,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
      margin: 0,
    }).catch(() => {})
  }, [content])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// Mini barcode preview using SVG
function BarcodePreview({ content, format }: { content: string; format: string }): JSX.Element {
  const svgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.innerHTML = ''
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      JsBarcode(svg, content, {
        format,
        width: 1,
        height: 40,
        displayValue: false,
        background: '#FFFFFF',
        lineColor: '#000000',
        margin: 0,
      })
      el.appendChild(svg)
    } catch {
      el.textContent = '条码错误'
    }
  }, [content, format])

  return <div ref={svgRef} className="w-full h-full flex items-center justify-center" />
}
