import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Barcode } from 'lucide-react'
import { QRCodeForm } from './components/QRCodeForm'
import { BarcodeForm } from './components/BarcodeForm'
import { cn } from '@/lib/utils'

type GeneratorTab = 'qr' | 'barcode'

export default function GeneratorPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('qr')

  return (
    <div className="h-full p-8 flex flex-col">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-text-primary">生成器</h1>
        <p className="mt-2 text-brand-text-secondary">QR Code · 条码 · 加密 · PNG/SVG/PDF 导出</p>
      </div>

      <div className="flex gap-1 mb-6 bg-brand-surface rounded-lg p-1 w-fit border border-brand-border">
        <button
          onClick={() => setActiveTab('qr')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'qr'
              ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
              : 'text-brand-text-secondary hover:text-brand-text-primary',
          )}
        >
          <QrCode className="w-4 h-4" /> QR Code
        </button>
        <button
          onClick={() => setActiveTab('barcode')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeTab === 'barcode'
              ? 'bg-brand-accent/10 text-brand-accent shadow-sm'
              : 'text-brand-text-secondary hover:text-brand-text-primary',
          )}
        >
          <Barcode className="w-4 h-4" /> 条码
        </button>
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'qr' && <QRCodeForm />}
            {activeTab === 'barcode' && <BarcodeForm />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
