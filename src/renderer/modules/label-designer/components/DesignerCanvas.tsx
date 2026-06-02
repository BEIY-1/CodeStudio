import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { useLabelStore } from '../store'
import { CanvasElement } from './CanvasElement'

export function DesignerCanvas(): JSX.Element {
  const { elements, selectedId, selectElement, canvasWidth, canvasHeight, removeElement, zoom, autoFit, setZoom, fitToScreen } =
    useLabelStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [autoScale, setAutoScale] = useState(1)

  // Auto-fit scale calculation
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const padding = 40
    const maxW = container.clientWidth - padding * 2
    const maxH = container.clientHeight - padding * 2
    const s = Math.min(1, maxW / canvasWidth, maxH / canvasHeight)
    setAutoScale(s)
  }, [canvasWidth, canvasHeight])

  // Effective scale: use autoScale when autoFit, otherwise manual zoom
  const effectiveScale = autoFit ? autoScale : zoom

  // Sync effective scale to store so LabelDesignerPage can show accurate display size
  useEffect(() => {
    useLabelStore.setState({ zoom: effectiveScale })
  }, [effectiveScale])

  // Keyboard: Delete to remove selected
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
        if (selectedId) removeElement(selectedId)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, removeElement])

  // Mouse wheel zoom (Ctrl+wheel)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      const currentZoom = autoFit ? autoScale : zoom
      const delta = e.deltaY > 0 ? -0.05 : 0.05
      setZoom(Math.max(0.25, Math.min(2, currentZoom + delta)))
    }
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [zoom, autoFit, autoScale, setZoom])

  const handleCanvasClick = useCallback(() => {
    selectElement(null)
  }, [selectElement])

  // Display zoom value for the slider = effective zoom
  const displayZoom = effectiveScale

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-1 py-1.5 border-b border-brand-border bg-brand-surface/30 shrink-0">
        <button
          onClick={() => setZoom(displayZoom - 0.1)}
          disabled={displayZoom <= 0.25}
          className="p-1 rounded hover:bg-brand-hover disabled:opacity-30 transition-colors text-brand-text-secondary"
          title="缩小 (Ctrl+滚轮)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <input
          type="range"
          min={25}
          max={200}
          value={Math.round(displayZoom * 100)}
          onChange={(e) => setZoom(Number(e.target.value) / 100)}
          className="w-24 h-1 accent-brand-primary cursor-pointer"
          title="缩放"
        />
        <button
          onClick={() => setZoom(displayZoom + 0.1)}
          disabled={displayZoom >= 2}
          className="p-1 rounded hover:bg-brand-hover disabled:opacity-30 transition-colors text-brand-text-secondary"
          title="放大 (Ctrl+滚轮)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-brand-text-muted w-10 text-center tabular-nums">
          {Math.round(displayZoom * 100)}%
        </span>
        <button
          onClick={fitToScreen}
          className={`p-1 rounded hover:bg-brand-hover transition-colors ${autoFit ? 'text-brand-primary' : 'text-brand-text-secondary'}`}
          title="适应窗口"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="flex-1 bg-brand-bg/50 overflow-auto flex items-center justify-center p-5"
      >
        <div
          className="relative bg-white shadow-lg flex-shrink-0"
          style={{
            width: canvasWidth * effectiveScale,
            height: canvasHeight * effectiveScale,
          }}
          onClick={handleCanvasClick}
        >
          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" width="100%" height="100%">
            <defs>
              <pattern id="grid" width={10 * effectiveScale} height={10 * effectiveScale} patternUnits="userSpaceOnUse">
                <path d={`M ${10 * effectiveScale} 0 L 0 0 0 ${10 * effectiveScale}`} fill="none" stroke="#000" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Elements */}
          {elements
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((el) => (
              <CanvasElement key={el.id} el={el} scale={effectiveScale} />
            ))}

          {/* Empty state */}
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-brand-text-muted">在此添加元素 · Ctrl+滚轮缩放</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
