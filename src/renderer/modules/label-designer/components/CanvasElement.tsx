import { useCallback, useState, useRef, useEffect } from 'react'
import { toCanvas } from 'qrcode'
import JsBarcode from 'jsbarcode'
import { cn } from '@/lib/utils'
import { encrypt } from '@/utils/crypto'
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
        // Shift = lock aspect ratio (all element types)
        if (e.shiftKey) {
          const aspectRatio = dragStart.current.elW / dragStart.current.elH
          const newW = Math.max(20, Math.round(dragStart.current.elW + dx))
          const newH = Math.max(20, Math.round(newW / aspectRatio))
          updateElement(el.id, { width: newW, height: newH })
        } else {
          updateElement(el.id, {
            width: Math.max(20, Math.round(dragStart.current.elW + dx)),
            height: Math.max(20, Math.round(dragStart.current.elH + dy)),
          })
        }
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

  const isEncrypted = (el.type === 'qr' || el.type === 'barcode') && el.encrypted && el.encPassword
  const isResizing = dragging === 'resize'

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
        {el.type === 'qr' && el.qrContent && !isEncrypted && (
          <QrPreview content={el.qrContent} width={el.width} height={el.height} defer={isResizing} />
        )}
        {el.type === 'qr' && el.qrContent && isEncrypted && (
          <EncryptedQrPreview content={el.qrContent} password={el.encPassword!} width={el.width} height={el.height} defer={isResizing} />
        )}
        {el.type === 'text' && (
          <div
            className="w-full h-full flex items-center justify-center px-1"
            style={{
              fontSize: (el.fontSize ?? 14) * scale,
              color: el.fontColor ?? '#000',
              fontFamily: el.fontFamily ?? 'sans-serif',
            }}
          >
            {el.textContent || '文本'}
          </div>
        )}
        {el.type === 'barcode' && el.barcodeContent && !isEncrypted && (
          <BarcodePreview
            content={el.barcodeContent}
            format={el.barcodeFormat ?? 'CODE128'}
            width={el.width}
            height={el.height}
            defer={isResizing}
          />
        )}
        {el.type === 'barcode' && el.barcodeContent && isEncrypted && (
          <EncryptedBarcodePreview
            content={el.barcodeContent}
            password={el.encPassword!}
            width={el.width}
            height={el.height}
            defer={isResizing}
          />
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-brand-primary rounded-full cursor-se-resize border-2 border-white"
          onMouseDown={(e) => handleMouseDown(e, 'resize')}
          title="拖拽调整大小 · 按住 Shift 锁定比例"
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Debounce helper — only runs `fn` after `ms` of inactivity on deps
// ---------------------------------------------------------------------------

function useDebouncedEffect(fn: () => void, deps: unknown[], ms: number): void {
  const fnRef = useRef(fn)
  fnRef.current = fn

  useEffect(() => {
    const timer = setTimeout(() => fnRef.current(), ms)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, ms])
}

// ---------------------------------------------------------------------------
// QR preview — debounced re-render on size change, instant on content change
// ---------------------------------------------------------------------------

function QrPreview({ content, width, height, defer }: {
  content: string
  width: number
  height: number
  defer: boolean
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Render at element's intrinsic size for 1:1 pixel mapping.
  // QR codes are square; canvas fills container via CSS w-full h-full
  // (stretching is acceptable for label design and avoids selection-ring mismatch).
  const renderSize = Math.max(width, height, 60)
  const lastRenderedRef = useRef(0)

  useDebouncedEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (defer && lastRenderedRef.current === renderSize) return
    lastRenderedRef.current = renderSize
    toCanvas(canvas, content, {
      width: renderSize,
      errorCorrectionLevel: 'M',
      color: { dark: '#000000', light: '#FFFFFF' },
      margin: 1,
    }).catch(() => {})
  }, [content, renderSize, defer], defer ? 120 : 0)

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  )
}

// ---------------------------------------------------------------------------
// Encrypted QR — encrypt once (cached), debounced re-render on resize
// ---------------------------------------------------------------------------

function EncryptedQrPreview({ content, password, width, height, defer }: {
  content: string
  password: string
  width: number
  height: number
  defer: boolean
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderSize = Math.max(width, height, 60)
  const lastRenderedRef = useRef(0)

  // Encrypt — only when content/password change (NOT on every resize!)
  const [encContent, setEncContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const encCacheRef = useRef<{ content: string; password: string; result: string } | null>(null)

  useEffect(() => {
    if (encCacheRef.current?.content === content && encCacheRef.current?.password === password) {
      setEncContent(encCacheRef.current.result)
      return
    }
    let cancelled = false
    encrypt(content, password)
      .then((cipher) => {
        if (cancelled) return
        encCacheRef.current = { content, password, result: cipher }
        setEncContent(cipher)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => { cancelled = true }
  }, [content, password])

  // Render encrypted QR — debounced on size change
  useDebouncedEffect(() => {
    if (!encContent) return
    const canvas = canvasRef.current
    if (!canvas) return
    if (defer && lastRenderedRef.current === renderSize) return
    lastRenderedRef.current = renderSize
    toCanvas(canvas, encContent, {
      width: renderSize,
      errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#FFFFFF' },
      margin: 1,
    }).catch(() => {})
  }, [encContent, renderSize, defer], defer ? 120 : 0)

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-danger bg-red-50">
        加密失败
      </div>
    )
  }
  if (!encContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
    />
  )
}

// ---------------------------------------------------------------------------
// Barcode preview — debounced SVG generation
// ---------------------------------------------------------------------------

function BarcodePreview({ content, format, width, height, defer }: {
  content: string
  format: string
  width: number
  height: number
  defer: boolean
}): JSX.Element {
  const svgRef = useRef<HTMLDivElement>(null)
  const lastW = useRef(0)
  const lastH = useRef(0)

  useDebouncedEffect(() => {
    const el = svgRef.current
    if (!el) return
    if (defer && lastW.current === width && lastH.current === height) return
    lastW.current = width
    lastH.current = height

    el.innerHTML = ''
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      JsBarcode(svg, content, {
        format,
        width: 1,
        height: Math.max(height, 30),
        displayValue: false,
        background: '#FFFFFF',
        lineColor: '#000000',
        margin: Math.min(4, width * 0.02),
      })
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.setAttribute('preserveAspectRatio', 'none')
      svg.style.display = 'block'
      el.appendChild(svg)
    } catch {
      el.textContent = '条码错误'
    }
  }, [content, format, width, height, defer], defer ? 120 : 0)

  return <div ref={svgRef} className="w-full h-full" />
}

// ---------------------------------------------------------------------------
// Encrypted barcode — encrypt once (cached), debounced SVG render
// ---------------------------------------------------------------------------

function EncryptedBarcodePreview({ content, password, width, height, defer }: {
  content: string
  password: string
  width: number
  height: number
  defer: boolean
}): JSX.Element {
  const svgRef = useRef<HTMLDivElement>(null)
  const lastW = useRef(0)
  const lastH = useRef(0)

  // Encrypt — cached, only when content/password change
  const [encContent, setEncContent] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const encCacheRef = useRef<{ content: string; password: string; result: string } | null>(null)

  useEffect(() => {
    if (encCacheRef.current?.content === content && encCacheRef.current?.password === password) {
      setEncContent(encCacheRef.current.result)
      return
    }
    let cancelled = false
    encrypt(content, password)
      .then((cipher) => {
        if (cancelled) return
        encCacheRef.current = { content, password, result: cipher }
        setEncContent(cipher)
        setError(false)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => { cancelled = true }
  }, [content, password])

  // Render barcode SVG — debounced on size change
  useDebouncedEffect(() => {
    if (!encContent) return
    const el = svgRef.current
    if (!el) return
    if (defer && lastW.current === width && lastH.current === height) return
    lastW.current = width
    lastH.current = height

    el.innerHTML = ''
    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      JsBarcode(svg, encContent, {
        format: 'CODE128',
        width: 1,
        height: Math.max(height, 30),
        displayValue: false,
        background: '#FFFFFF',
        lineColor: '#000000',
        margin: Math.min(4, width * 0.02),
      })
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.setAttribute('preserveAspectRatio', 'none')
      svg.style.display = 'block'
      el.appendChild(svg)
    } catch {
      el.textContent = '加密条码错误'
    }
  }, [encContent, width, height, defer], defer ? 120 : 0)

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[10px] text-brand-danger bg-red-50">
        加密失败
      </div>
    )
  }
  if (!encContent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-3 h-3 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  return <div ref={svgRef} className="w-full h-full" />
}
