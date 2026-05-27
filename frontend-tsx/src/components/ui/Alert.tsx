import { cn } from '@/lib/cn'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'error' | 'success' | 'warning' | 'info'
  title?: string
  onClose?: () => void
}

const config = {
  error:   { icon: AlertCircle,     bg: 'bg-[var(--color-error-container)]',   text: 'text-[var(--color-error)]',   border: 'border-red-200' },
  success: { icon: CheckCircle2,    bg: 'bg-[var(--color-success-container)]', text: 'text-[var(--color-success)]', border: 'border-green-200' },
  warning: { icon: AlertCircle,     bg: 'bg-amber-50',                          text: 'text-amber-800',              border: 'border-amber-200' },
  info:    { icon: Info,            bg: 'bg-[var(--color-secondary-container)]',text: 'text-[var(--color-secondary)]',border: 'border-blue-200' },
}

export function Alert({ variant = 'error', title, children, className, onClose, ...props }: AlertProps) {
  const { icon: Icon, bg, text, border } = config[variant]
  return (
    <div
      className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', bg, text, border, className)}
      {...props}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div className="text-left flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        {children}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
          <X size={14} />
        </button>
      )}
    </div>
  )
}
