import { useState } from 'react'
import { Settings } from 'lucide-react'
import { ElementToolbar } from './components/ElementToolbar'
import { DesignerCanvas } from './components/DesignerCanvas'
import { PropertyPanel } from './components/PropertyPanel'
import { useLabelStore } from './store'

export default function LabelDesignerPage(): JSX.Element {
  const { canvasWidth, canvasHeight, elements, selectedId, setCanvasSize } = useLabelStore()
  const selectedEl = elements.find((e) => e.id === selectedId)
  const [showSizeDialog, setShowSizeDialog] = useState(false)
  const [tempW, setTempW] = useState(canvasWidth)
  const [tempH, setTempH] = useState(canvasHeight)

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-brand-border bg-brand-surface/50 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-lg font-bold text-brand-text-primary">标签设计</h1>
          <ElementToolbar />
        </div>
        <div className="flex items-center gap-3 text-xs text-brand-text-muted">
          <button
            className="flex items-center gap-1 hover:text-brand-text-primary transition-colors"
            onClick={() => {
              setTempW(canvasWidth)
              setTempH(canvasHeight)
              setShowSizeDialog(true)
            }}
          >
            <Settings className="w-3.5 h-3.5" />
            {canvasWidth}×{canvasHeight} px
          </button>
          <span>|</span>
          <span>元素: {elements.length}</span>
          {selectedEl && (
            <>
              <span>|</span>
              <span>选中: {selectedEl.type}</span>
            </>
          )}
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        <DesignerCanvas />
        <PropertyPanel />
      </div>

      {/* Canvas size dialog */}
      {showSizeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowSizeDialog(false)}>
          <div
            className="bg-brand-surface border border-brand-border rounded-xl p-6 w-72 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-brand-text-primary">画布尺寸</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-brand-text-muted block mb-1">宽度 (px)</label>
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={tempW}
                  onChange={(e) => setTempW(Number(e.target.value))}
                  className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="text-xs text-brand-text-muted block mb-1">高度 (px)</label>
                <input
                  type="number"
                  min={50}
                  max={2000}
                  value={tempH}
                  onChange={(e) => setTempH(Number(e.target.value))}
                  className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSizeDialog(false)}
                className="px-3 py-1.5 text-xs rounded-md text-brand-text-secondary hover:text-brand-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setCanvasSize(tempW, tempH)
                  setShowSizeDialog(false)
                }}
                className="px-3 py-1.5 text-xs rounded-md bg-brand-primary text-white hover:bg-brand-primary/90 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
