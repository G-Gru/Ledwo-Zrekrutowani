import { NavLink } from 'react-router-dom'
import { FileText, CreditCard, FolderOpen, UserCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const links = [
  { to: '/my-applications', label: 'Moje wnioski',   icon: FileText },
  { to: '/my-payments',     label: 'Płatności',       icon: CreditCard },
  { to: '/my-documents',    label: 'Dokumenty',       icon: FolderOpen },
  { to: '/my-profile',      label: 'Mój profil',      icon: UserCircle },
]

export default function AccountSidebar() {
  return (
    <aside className="w-[260px] shrink-0 min-h-[calc(100vh-56px)] bg-[var(--color-surface-container)] border-r border-[var(--color-surface-high)] p-4 flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-[var(--color-primary-container)] text-[var(--color-primary)]'
                : 'text-[var(--color-text)] hover:bg-[var(--color-surface-high)]'
            )
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </aside>
  )
}
