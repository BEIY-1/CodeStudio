import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, QrCode, Scan, Layers, ClipboardList, History, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/stores/app-store'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard, QrCode, Scan, Layers, ClipboardList, History, Settings,
}

export function Sidebar(): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarExpanded, toggleSidebar } = useAppStore()
  const currentPath = location.pathname.replace('/', '') || 'dashboard'

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarExpanded ? 240 : 52 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-brand-surface/80 backdrop-blur-sm border-r border-brand-border overflow-hidden shrink-0"
    >
      {/* 品牌区 — 金石印章 */}
      <div className="flex items-center justify-center h-12 border-b border-brand-border shrink-0">
        {sidebarExpanded ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 px-4"
          >
            <span className="w-7 h-7 rounded-md bg-brand-primary/10 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-brand-primary" />
            </span>
            <span className="font-display text-sm font-bold text-brand-text-primary tracking-wider">
              CodeStudio
            </span>
          </motion.div>
        ) : (
          <span className="w-7 h-7 rounded-md bg-brand-primary/10 flex items-center justify-center">
            <QrCode className="w-4 h-4 text-brand-primary" />
          </span>
        )}
      </div>

      {/* 导航项 */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = currentPath === item.id

          return (
            <Tooltip key={item.id}>
              <TooltipTrigger>
                <button
                  onClick={() => navigate(`/${item.id === 'dashboard' ? '' : item.id}`)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all duration-200',
                    isActive
                      ? 'bg-brand-primary/10 text-brand-primary font-medium'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-hover',
                  )}
                >
                  {Icon && (
                    <span className={cn(
                      'w-5 h-5 shrink-0 flex items-center justify-center',
                      isActive && 'text-brand-primary',
                    )}>
                      <Icon className="w-[18px] h-[18px]" />
                    </span>
                  )}
                  <AnimatePresence>
                    {sidebarExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap text-[13px]"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </TooltipTrigger>
              {!sidebarExpanded && (
                <TooltipContent side="right">{item.label}</TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </nav>

      {/* 折叠按钮 */}
      <div className="border-t border-brand-border p-2 shrink-0">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}
          className="w-full h-8 hover:bg-brand-primary/10 transition-colors">
          {sidebarExpanded ? (
            <ChevronLeft className="w-4 h-4 text-brand-text-muted" />
          ) : (
            <ChevronRight className="w-4 h-4 text-brand-text-muted" />
          )}
        </Button>
      </div>
    </motion.aside>
  )
}
