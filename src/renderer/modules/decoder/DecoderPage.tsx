import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, Camera, Keyboard, Grid3X3, Unlock } from 'lucide-react'
import { ImageDecoder } from './components/ImageDecoder'
import { CameraDecoder } from './components/CameraDecoder'
import { ScannerGunDecoder } from './components/ScannerGunDecoder'
import { MultiCodeDecoder } from './components/MultiCodeDecoder'
import { EncryptedDecoder } from './components/EncryptedDecoder'
import { cn } from '@/lib/utils'

type DecoderTab = 'image' | 'camera' | 'scanner' | 'multi' | 'encrypted'

const tabs: { id: DecoderTab; label: string; icon: typeof Image }[] = [
  { id: 'image', label: '图片识别', icon: Image },
  { id: 'camera', label: '摄像头', icon: Camera },
  { id: 'scanner', label: '扫码枪', icon: Keyboard },
  { id: 'multi', label: '多码识别', icon: Grid3X3 },
  { id: 'encrypted', label: '解密', icon: Unlock },
]

export default function DecoderPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<DecoderTab>('image')

  return (
    <div className="h-full p-8 flex flex-col">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-brand-text-primary">解码器</h1>
        <p className="mt-2 text-brand-text-secondary">
          图片识别 · 摄像头扫描 · 扫码枪 · 多码解析
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-brand-surface rounded-lg p-1 w-fit border border-brand-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-brand-primary/10 text-brand-primary shadow-sm'
                : 'text-brand-text-secondary hover:text-brand-text-primary',
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'image' && <ImageDecoder />}
            {activeTab === 'camera' && <CameraDecoder />}
            {activeTab === 'scanner' && <ScannerGunDecoder />}
            {activeTab === 'multi' && <MultiCodeDecoder />}
            {activeTab === 'encrypted' && <EncryptedDecoder />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
