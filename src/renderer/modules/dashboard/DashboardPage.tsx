import { useNavigate } from 'react-router-dom'
import { QrCode, Scan, Layers, PenTool, ArrowRight, Cpu, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

const modules = [
  { icon: QrCode, title: '生成器', desc: 'QR · 条码 · 加密二维码', path: '/generator' },
  { icon: Scan, title: '解码器', desc: '图片 · 摄像头 · 扫码枪 · 多码', path: '/decoder' },
  { icon: Layers, title: '批量中心', desc: 'Excel 导入 · 模板 · 批量生成', path: '/batch' },
  { icon: PenTool, title: '标签设计', desc: '拖拽画布 · 二维码/条码/文本 · 批量打印', path: '/label-designer' },
]

export default function DashboardPage(): JSX.Element {
  const navigate = useNavigate()
  const [time, setTime] = useState('')

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-10 space-y-10">
        {/* 头部 */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-brand-text-primary leading-tight">
              CodeStudio
            </h1>
            <p className="mt-2 text-brand-text-secondary text-sm max-w-sm">
              QR & Barcode Workspace — 离线优先的专业条码工作站
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl text-brand-primary font-medium tracking-wider">
              {time || '--:--'}
            </p>
            <p className="text-[11px] text-brand-text-muted mt-1 font-mono">
              SYS.ONLINE
            </p>
          </div>
        </div>

        {/* 功能模块 — 2×2 科技卡片 */}
        <div className="grid grid-cols-2 gap-4">
          {modules.map((m) => (
            <button
              key={m.title}
              onClick={() => navigate(m.path)}
              className={cn(
                'group text-left p-5 rounded-xl border border-brand-border cursor-pointer relative overflow-hidden',
                'bg-brand-surface/60 backdrop-blur-sm',
                'hover:border-brand-primary/40 hover:bg-brand-surface transition-all duration-300',
                'hover:shadow-glow',
              )}
            >
              {/* 卡片顶部光条 */}
              <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start gap-4 relative">
                <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center shrink-0 group-hover:shadow-glow-sm transition-shadow">
                  <m.icon className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-bold text-brand-text-primary mb-1">
                    {m.title}
                  </h3>
                  <p className="text-[13px] text-brand-text-secondary">{m.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-brand-primary mt-3 opacity-0 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-1 shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {/* 系统状态 */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Cpu, label: '离线引擎', sub: '本地处理' },
            { icon: Shield, label: 'AES-256 加密', sub: 'Web Crypto' },
            { icon: Zap, label: '实时解码', sub: 'jsQR 引擎' },
          ].map((s) => (
            <div key={s.label}
              className="flex items-center gap-3 p-4 rounded-xl border border-brand-border bg-brand-surface/40">
              <s.icon className="w-5 h-5 text-brand-primary/60" />
              <div>
                <p className="text-sm font-medium text-brand-text-primary">{s.label}</p>
                <p className="text-xs text-brand-text-muted">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="glow-divider" />

        <div className="flex items-center gap-6 text-xs text-brand-text-muted font-mono">
          <span>CODE-STUDIO v1.0</span>
          <span className="w-1 h-1 rounded-full bg-brand-primary/50" />
          <span>OFFLINE-FIRST</span>
          <span className="w-1 h-1 rounded-full bg-brand-primary/50" />
          <span>ELECTRON + REACT</span>
        </div>
      </div>
    </div>
  )
}
