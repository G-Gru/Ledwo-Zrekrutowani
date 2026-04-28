import { Link, useLocation } from 'react-router-dom';
import { getUserType, getUserRole } from '../services/authService';
import '../styles/AccountMenu.css'

export default function AccountPageLeftMenu() {
  const location = useLocation();
  const userType = getUserType();
  const userRole = getUserRole();

  // Warunkowa widoczność dla studentów (tylko profil)
  const isStudent = userType === 'STUDENT';
  
  // Logika dla paneli pracowników i admina
  const canSeeCoordinatorPanel = 
    userRole === 'STUDIES_DIRECTOR' || 
    userRole === 'ADMINISTRATIVE_COORDINATOR' || 
    userRole === 'ADMIN';
  
  const canSeeFinancePanel = 
    userRole === 'FINANCE_COORDINATOR' || 
    userRole === 'ADMIN';
  
  const canSeeAdminPanel = userRole === 'ADMIN';

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  const NavLink = ({ to, icon, label, indent = false }) => (
    <Link 
      to={to} 
      className={`menu-item ${isActive(to) ? 'active' : ''} ${indent ? 'indent' : ''}`}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="label">{label}</span>
    </Link>
  );

  return (
    <div className='account-column' id="account-page-column-left">
      <nav className="side-menu">
        {/* Sekcja główna */}
        <NavLink to="/my-profile" icon="person" label="Profil" />

        {/* Moje wnioski i płatności - tylko dla studentów */}
        {isStudent && (
          <>
            <NavLink to="/my-payments" icon="payments" label="Płatności" />
            <NavLink to="/my-applications" icon="assignment" label="Moje wnioski" />
          </>
        )}

        {/* Panel koordynatora - dla kierownika, koordynatora admin i admina */}
        {canSeeCoordinatorPanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel koordynatora</div>
            <div className='sub-menu'>
              <NavLink to='/admin/candidates' icon='group' label='Kandydaci' indent />
              <NavLink to='/admin/applications' icon='fact_check' label='Przegląd zgłoszeń' indent />
              <NavLink to='/admin/export' icon='ios_share' label='Export do USOS' indent />
            </div>
          </>
        )}

        {/* Panel finansowy - dla koordynatora finansowego i admina */}
        {canSeeFinancePanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel finansowy</div>
            <div className='sub-menu'>
              <NavLink to='/admin/finances' icon='account_balance_wallet' label='Finanse' indent />
            </div>
          </>
        )}

        {/* Panel administratora - tylko dla admina */}
        {canSeeAdminPanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel administratora</div>
            <div className="sub-menu">
              <NavLink to='/manage-studies/offers' icon='school' label='Kierunki studiów' indent />
              <NavLink to='/manage-studies/editions' icon='calendar_month' label='Edycje studiów' indent />
            </div>
          </>
        )}
      </nav>
    </div>
  );
}