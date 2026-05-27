import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default:  'bg-[var(--color-surface-container)] text-[var(--color-text-muted)]',
        primary:  'bg-[var(--color-primary-container)] text-[var(--color-primary)]',
        success:  'bg-[var(--color-success-container)] text-[var(--color-success)]',
        warning:  'bg-amber-100 text-amber-800',
        danger:   'bg-[var(--color-error-container)] text-[var(--color-error)]',
        info:     'bg-[var(--color-secondary-container)] text-[var(--color-secondary)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
