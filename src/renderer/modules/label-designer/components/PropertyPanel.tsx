import { Trash2, ArrowUp, ArrowDown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLabelStore } from '../store'

export function PropertyPanel(): JSX.Element {
  const { elements, selectedId, updateElement, removeElement, bringForward, sendBackward } =
    useLabelStore()

  const el = elements.find((e) => e.id === selectedId)

  if (!el) {
    return (
      <div className="w-64 shrink-0 p-4 border-l border-brand-border bg-brand-surface/30">
        <p className="text-sm text-brand-text-muted text-center pt-8">选中元素后可编辑</p>
      </div>
    )
  }

  return (
    <div className="w-64 shrink-0 p-4 border-l border-brand-border bg-brand-surface/30 overflow-y-auto space-y-4">
      <h3 className="text-sm font-semibold text-brand-text-primary">
        {el.type === 'image' && '图片'}
        {el.type === 'qr' && '二维码'}
        {el.type === 'text' && '文本'}
        {el.type === 'barcode' && '条码'}
      </h3>

      {/* Content */}
      {(el.type === 'qr' || el.type === 'barcode' || el.type === 'text') && (
        <Field label="内容">
          <input
            value={
              el.type === 'qr' ? el.qrContent ?? ''
              : el.type === 'barcode' ? el.barcodeContent ?? ''
              : el.textContent ?? ''
            }
            onChange={(e) => {
              const val = e.target.value
              if (el.type === 'qr') updateElement(el.id, { qrContent: val })
              else if (el.type === 'barcode') updateElement(el.id, { barcodeContent: val })
              else updateElement(el.id, { textContent: val })
            }}
            className={inputClass}
          />
        </Field>
      )}

      {/* Barcode format */}
      {el.type === 'barcode' && !el.encrypted && (
        <Field label="条码格式">
          <select
            value={el.barcodeFormat ?? 'CODE128'}
            onChange={(e) => updateElement(el.id, { barcodeFormat: e.target.value })}
            className="w-full rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text-primary focus:outline-none"
          >
            <option value="CODE128">Code128</option>
            <option value="CODE39">Code39</option>
            <option value="EAN13">EAN-13</option>
            <option value="EAN8">EAN-8</option>
            <option value="UPC">UPC</option>
          </select>
        </Field>
      )}

      {/* Encryption (QR / Barcode) */}
      {(el.type === 'qr' || el.type === 'barcode') && (
        <div className="border-t border-brand-border/50 pt-3 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={el.encrypted ?? false}
              onChange={(e) => {
                updateElement(el.id, {
                  encrypted: e.target.checked,
                  encPassword: e.target.checked ? (el.encPassword ?? '') : undefined,
                  ...(el.type === 'barcode' && e.target.checked ? { barcodeFormat: 'CODE128' } : {}),
                })
              }}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-brand-border rounded-full peer-checked:bg-brand-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all relative" />
            <span className="text-xs text-brand-text-secondary flex items-center gap-1">
              <Lock className="w-3 h-3" />
              AES-256-GCM 加密
            </span>
          </label>

          {el.encrypted && (
            <div>
              <label className="text-xs text-brand-text-muted block mb-1">加密密码</label>
              <input
                type="password"
                value={el.encPassword ?? ''}
                onChange={(e) => updateElement(el.id, { encPassword: e.target.value })}
                placeholder="输入加密密码..."
                className={inputClass}
              />
              {el.type === 'barcode' && (
                <p className="text-[10px] text-brand-text-muted mt-0.5">
                  加密后自动使用 Code128 格式
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Position & Size */}
      <div className="border-t border-brand-border/50 pt-3">
        <p className="text-xs text-brand-text-muted mb-2">位置与尺寸</p>
        <div className="grid grid-cols-2 gap-2">
          <Field label="X">
            <input type="number" value={el.x} onChange={(e) => updateElement(el.id, { x: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="Y">
            <input type="number" value={el.y} onChange={(e) => updateElement(el.id, { y: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="宽">
            <input type="number" min={10} value={el.width} onChange={(e) => updateElement(el.id, { width: Number(e.target.value) })} className={inputClass} />
          </Field>
          <Field label="高">
            <input type="number" min={10} value={el.height} onChange={(e) => updateElement(el.id, { height: Number(e.target.value) })} className={inputClass} />
          </Field>
        </div>
      </div>

      {/* Rotation */}
      <Field label="旋转">
        <select
          value={el.rotation}
          onChange={(e) => updateElement(el.id, { rotation: Number(e.target.value) as 0 | 90 | 180 | 270 })}
          className="w-full rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text-primary focus:outline-none"
        >
          <option value={0}>0°</option>
          <option value={90}>90°</option>
          <option value={180}>180°</option>
          <option value={270}>270°</option>
        </select>
      </Field>

      {/* Font size (text only) */}
      {el.type === 'text' && (
        <Field label="字号">
          <input
            type="number" min={8} max={120}
            value={el.fontSize ?? 14}
            onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) })}
            className={inputClass}
          />
        </Field>
      )}

      {/* Font color (text only) */}
      {el.type === 'text' && (
        <Field label="颜色">
          <input
            type="color"
            value={el.fontColor ?? '#000000'}
            onChange={(e) => updateElement(el.id, { fontColor: e.target.value })}
            className="w-full h-7 rounded border border-brand-border cursor-pointer"
          />
        </Field>
      )}

      {/* Font family (text only) */}
      {el.type === 'text' && (
        <Field label="字体">
          <select
            value={el.fontFamily ?? 'sans-serif'}
            onChange={(e) => updateElement(el.id, { fontFamily: e.target.value })}
            className="w-full rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text-primary focus:outline-none"
            style={{ fontFamily: el.fontFamily ?? 'sans-serif' }}
          >
            <option value="sans-serif">Sans Serif (默认)</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
            <option value="Microsoft YaHei, sans-serif">微软雅黑</option>
            <option value="SimSun, serif">宋体</option>
            <option value="SimHei, sans-serif">黑体</option>
            <option value="KaiTi, serif">楷体</option>
            <option value="FangSong, serif">仿宋</option>
            <option value="LXGW WenKai, serif">霞鹜文楷</option>
            <option value="Source Han Sans SC, sans-serif">思源黑体</option>
            <option value="JetBrains Mono, monospace">JetBrains Mono</option>
          </select>
        </Field>
      )}

      {/* Layer controls */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => bringForward(el.id)}>
          <ArrowUp className="w-3 h-3 mr-1" /> 置顶
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => sendBackward(el.id)}>
          <ArrowDown className="w-3 h-3 mr-1" /> 置底
        </Button>
      </div>

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => removeElement(el.id)}
      >
        <Trash2 className="w-3 h-3 mr-1.5" /> 删除
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="text-xs text-brand-text-muted mb-1 block">{label}</label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded border border-brand-border bg-brand-bg px-2 py-1 text-xs text-brand-text-primary font-mono focus:outline-none focus:ring-1 focus:ring-brand-primary'
