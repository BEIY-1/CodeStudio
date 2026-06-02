import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
})

export function TooltipProvider({ children }: { children: React.ReactNode }): JSX.Element {
  return <>{children}</>
}

interface TooltipProps {
  children: React.ReactNode
  delayDuration?: number
}

export function Tooltip({ children, delayDuration = 300 }: TooltipProps): JSX.Element {
  const [open, setOpen] = React.useState(false)
  const timerRef = React.useRef<NodeJS.Timeout>()

  const handleEnter = () => {
    timerRef.current = setTimeout(() => setOpen(true), delayDuration)
  }

  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-block"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

export function TooltipTrigger({
  children,
}: {
  children: React.ReactNode
  asChild?: boolean
}): JSX.Element {
  return <>{children}</>
}

interface TooltipContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function TooltipContent({
  children,
  side = 'right',
  className,
}: TooltipContentProps): JSX.Element {
  const { open } = React.useContext(TooltipContext)

  if (!open) return <></>

  const sideStyles: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div
      className={cn(
        'absolute z-50 animate-fade-in rounded-md border border-brand-border bg-brand-hover px-3 py-1.5 text-xs text-brand-text-primary shadow-md',
        sideStyles[side],
        className,
      )}
    >
      {children}
    </div>
  )
}
