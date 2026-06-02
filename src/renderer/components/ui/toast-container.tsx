import { AnimatePresence, motion } from 'framer-motion'
import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { useToastStore, type Toast } from './use-toast'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
}

const colorMap: Record<string, string> = {
  info: 'border-brand-primary text-brand-primary',
  success: 'border-brand-success text-brand-success',
  warning: 'border-brand-warning text-brand-warning',
  error: 'border-brand-danger text-brand-danger',
}

function ToastItem({ toast }: { toast: Toast }): JSX.Element {
  const removeToast = useToastStore((s) => s.removeToast)
  const Icon = iconMap[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-3 p-4 rounded-lg border bg-brand-surface shadow-lg min-w-[320px] max-w-[420px] ${colorMap[toast.type]}`}
    >
      {Icon && <Icon className="w-5 h-5 shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-brand-text-secondary mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-brand-text-muted hover:text-brand-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export function ToastContainer(): JSX.Element {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
