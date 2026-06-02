import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-brand-primary text-white hover:bg-blue-600 shadow-sm':
              variant === 'default',
            'bg-brand-danger text-white hover:bg-red-600 shadow-sm':
              variant === 'destructive',
            'border border-brand-border bg-transparent hover:bg-brand-hover text-brand-text-primary':
              variant === 'outline',
            'bg-brand-hover text-brand-text-primary hover:bg-brand-border':
              variant === 'secondary',
            'hover:bg-brand-hover text-brand-text-primary': variant === 'ghost',
            'text-brand-primary underline-offset-4 hover:underline':
              variant === 'link',
          },
          {
            'h-9 px-4 py-2': size === 'default',
            'h-8 rounded-md px-3 text-xs': size === 'sm',
            'h-10 rounded-md px-8': size === 'lg',
            'h-9 w-9': size === 'icon',
          },
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button }
