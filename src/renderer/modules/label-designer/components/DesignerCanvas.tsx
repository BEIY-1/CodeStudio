import { useState, useRef, useCallback, useEffect } from 'react'
import { useLabelStore } from '../store'
import { CanvasElement } from './CanvasElement'

export function DesignerCanvas(): JSX.Element {
  const { elements, selectedId, selectElement, canvasWidth, canvasHeight, removeElement } =
    useLabelStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  // Fit canvas to container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const padding = 40
    const maxW = container.clientWidth - padding * 2
    const maxH = container.clientHeight - padding * 2
    const s = Math.min(1, maxW / canvasWidth, maxH / canvasHeight)
    setScale(s)
  }, [canvasWidth, canvasHeight])

  // Keyboard: Delete to remove selected
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Don't delete if user is typing in an input
        if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
        if (selectedId) removeElement(selectedId)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedId, removeElement])

  const handleCanvasClick = useCallback(() => {
    selectElement(null)
  }, [selectElement])

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-brand-bg/50 overflow-auto flex items-center justify-center p-5"
    >
      <div
        className="relative bg-white shadow-lg flex-shrink-0"
        style={{
          width: canvasWidth * scale,
          height: canvasHeight * scale,
        }}
        onClick={handleCanvasClick}
      >
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-5" width="100%" height="100%">
          <defs>
            <pattern id="grid" width={10 * scale} height={10 * scale} patternUnits="userSpaceOnUse">
              <path d={`M ${10 * scale} 0 L 0 0 0 ${10 * scale}`} fill="none" stroke="#000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Elements */}
        {elements
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => (
            <CanvasElement key={el.id} el={el} scale={scale} />
          ))}

        {/* Empty state */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-brand-text-muted">在此添加元素</p>
          </div>
        )}
      </div>
    </div>
  )
}
