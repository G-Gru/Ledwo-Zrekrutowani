import { NavLink } from 'react-router-dom'
import { BarChart3, Users, CreditCard, Download, Bell, BookOpen, Building2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/context/AuthContext'

export default function AdminSidebar() {
  const { user } = useAuth()
  const isAdmin     = user?.role === 'ADMIN'
  const isCoord     = ['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR'].includes(user?.role ?? '')
  const isFinance   = ['ADMIN', 'FINANCE_COORDINATOR'].includes(user?.role ?? '')

  const coordLinks = [
    { to: '/admin/dashboard',     label: 'Statystyki',         icon: BarChart3 },
    { to: '/admin/candidates',    label: 'Kandydaci',           icon: Users },
    { to: '/admin/notifications', label: 'Powiadomienia',       icon: Bell },
    { to: '/admin/export',        label: 'Eksport danych',      icon: Download },
  ]

  const financeLinks = [
    { to: '/admin/finances', label: 'Finanse', icon: CreditCard },
  ]

  const adminLinks = [
    { to: '/manage-studies/editions', label: 'Edycje studiów',  icon: BookOpen },
    { to: '/manage-studies/offers',   label: 'Oferty studiów',  icon: BookOpen },
    { to: '/manage-studies/employees',label: 'Pracownicy',      icon: Building2 },
  ]

  const section = (title: string, items: typeof coordLinks) => (
    <div className="mb-4">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted px-3 mb-1">{title}</p>
      {items.map(({ to, label, icon: Icon }) => (
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
    </div>
  )

  return (
    <aside className="w-[230px] shrink-0 min-h-[calc(100vh-56px)] bg-surface-container border-r border-surface-high p-4">
      {isCoord   && section('Rekrutacja', coordLinks)}
      {isFinance && section('Finanse', financeLinks)}
      {isAdmin   && section('Administracja', adminLinks)}
    </aside>
  )
}
