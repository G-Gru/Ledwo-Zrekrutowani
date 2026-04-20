import { Link, useLocation } from 'react-router-dom';
import { getUserType } from '../services/authService';
import '../styles/AccountMenu.css'

export default function AccountPageLeftMenu() {
  const location = useLocation();
  const userType = getUserType();
  const canSeeRecruitmentPanel = userType === 'ADMIN' || userType === 'EMPLOYEE';
  const canSeeCoordinatorPanel = userType === 'ADMIN' || userType === 'EMPLOYEE';
  const canSeeAdminPanel = userType === 'ADMIN';

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
        <NavLink to="/my-documents" icon="description" label="Dokumenty" />
        <NavLink to="/my-payments" icon="payments" label="Płatności" />
        <NavLink to="/my-applications" icon="assignment" label="Moje wnioski" />

        {canSeeRecruitmentPanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel rekrutacji</div>
            <div className='sub-menu'>
              <NavLink to='/admin/candidates' icon='group' label='Kandydaci' indent />
              <NavLink to='/admin/applications' icon='fact_check' label='Przegląd zgłoszeń' indent />
            </div>
          </>
        )}

        {canSeeCoordinatorPanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel koordynatora</div>
            <div className='sub-menu'>
              <NavLink to='/manage-studies' icon='school' label='Oferty i edycje' indent />
            </div>
          </>
        )}

        {canSeeAdminPanel && (
          <>
            <hr className='menu-divider' />
            <div className='menu-section-header'>Panel administratora</div>
          <div className="sub-menu">
            <NavLink to='/admin/finances' icon='account_balance_wallet' label='Finanse' indent />
            <NavLink to='/admin/export' icon='ios_share' label='Eksport danych' indent />
          </div>
          </>
        )}
      </nav>
    </div>
  );
}