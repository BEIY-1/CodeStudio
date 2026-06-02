import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { Button } from '@/components/ui/button'

export function DetailPanel(): JSX.Element {
  const { detailPanelOpen, closePanel } = useAppStore()

  return (
    <AnimatePresence>
      {detailPanelOpen && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="overflow-hidden border-l border-brand-border bg-brand-surface shrink-0"
        >
          <div className="w-[320px] h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <h3 className="font-display text-sm font-semibold text-brand-text-primary">
                详情面板
              </h3>
              <Button variant="ghost" size="icon" onClick={closePanel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-4 text-sm text-brand-text-secondary">
              选择项目以查看详情
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
