import { Link, useLocation } from 'react-router-dom'
import { User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const isActive = (...paths: string[]) =>
    paths.some((p) => pathname === p || (p.endsWith('*') && pathname.startsWith(p.slice(0, -1))))

  const isAdmin           = user?.role === 'ADMIN'
  const isCoordinator     = ['ADMIN', 'STUDIES_DIRECTOR', 'ADMINISTRATIVE_COORDINATOR'].includes(user?.role ?? '')
  const isFinance         = ['ADMIN', 'FINANCE_COORDINATOR'].includes(user?.role ?? '')
  const isCandidate       = ['CANDIDATE', 'STUDENT'].includes(user?.role ?? '')

  const navLink = (to: string, label: string, active: boolean) => (
    <Link
      to={to}
      className={[
        'text-sm font-medium text-white transition-colors pb-0.5',
        active
          ? 'border-b-2 border-white/70 text-white/80'
          : 'hover:text-white/70',
      ].join(' ')}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 w-full shadow-md" style={{ backgroundColor: '#4c545c' }}>
      <div className="flex items-center justify-between px-8 py-3 gap-6">
        <Link to="/studies" className="flex items-center gap-3 shrink-0">
          <img
            src="/assets/logo.png"
            alt="AGH"
            className="h-10 w-auto"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        </Link>

        <nav className="flex items-center gap-6 flex-wrap justify-end">
          {navLink('/studies', 'Oferty studiów', isActive('/studies', '/studies/editions/*'))}
          {navLink('/faq', 'FAQ', isActive('/faq'))}
          {navLink('/contact', 'Kontakt', isActive('/contact'))}

          {isCoordinator && navLink('/admin/dashboard', 'Panel koordynatora', isActive('/admin/*'))}
          {isFinance && !isCoordinator && navLink('/admin/finances', 'Panel finansowy', isActive('/admin/finances'))}
          {isAdmin && navLink('/manage-studies/editions', 'Panel administratora', isActive('/manage-studies/*'))}

          <Link
            to={isCandidate ? '/my-applications' : user ? '/my-profile' : '/login'}
            className={[
              'flex items-center gap-1.5 text-sm font-medium text-white hover:text-white/70 transition-colors pb-0.5',
              isActive('/my-profile', '/my-applications', '/my-payments', '/my-documents', '/login') ? 'border-b-2 border-white/70' : '',
            ].join(' ')}
          >
            <User size={18} />
            {user ? user.first_name || user.email : 'Zaloguj się'}
          </Link>
        </nav>
      </div>
    </header>
  )
}
