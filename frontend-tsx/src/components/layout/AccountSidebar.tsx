import { NavLink } from 'react-router-dom'
import { FileText, CreditCard, FolderOpen, UserCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/context/AuthContext'

const ALL_LINKS = [
  { to: '/my-applications', label: 'Moje wnioski',   icon: FileText,   employeeOnly: false },
  { to: '/my-payments',     label: 'Płatności',       icon: CreditCard, employeeOnly: false },
  { to: '/my-documents',    label: 'Dokumenty',       icon: FolderOpen, employeeOnly: false },
  { to: '/my-profile',      label: 'Mój profil',      icon: UserCircle, employeeOnly: true  },
]

export default function AccountSidebar() {
  const { user } = useAuth()
  const isEmployee = user?.role !== 'CANDIDATE' && user?.role !== 'STUDENT'
  const links = isEmployee ? ALL_LINKS.filter((l) => l.employeeOnly) : ALL_LINKS

  return (
    <aside className="w-[260px] shrink-0 min-h-[calc(100vh-56px)] bg-surface-container border-r border-surface-high p-4 flex flex-col gap-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-container text-primary'
                : 'text-text hover:bg-surface-high'
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
