import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:   'bg-[var(--color-primary-container)] text-[var(--color-primary)] hover:bg-yellow-300',
        secondary: 'border border-[var(--color-surface-high)] bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-high)]',
        danger:    'bg-[var(--color-error)] text-white hover:bg-red-800',
        warning:   'bg-[var(--color-warning)] text-amber-950 hover:bg-amber-600',
        success:   'bg-green-700 text-white hover:bg-green-800',
        ghost:     'bg-transparent hover:bg-[var(--color-surface-container)] text-[var(--color-text)]',
        link:      'bg-transparent underline text-[var(--color-secondary)] hover:text-[var(--color-primary)] p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
