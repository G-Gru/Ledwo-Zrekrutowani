import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMockAdminEnrollmentPreviewId } from '../mocks/adminEnrollmentMocks';
import '../styles/AccountMenu.css'

export default function AccountPageLeftMenu() {
  const location = useLocation();
  // Stan do rozwijania panelu administratora
  const [isAdminOpen, setIsAdminOpen] = useState(true);

  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));
  const previewEnrollmentId = getMockAdminEnrollmentPreviewId();

  // Pomocnicza funkcja do renderowania linku
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

        <hr className="menu-divider" />

        {/* Panel Administratora */}
        <div 
          className="menu-item" 
          onClick={() => setIsAdminOpen(!isAdminOpen)}
        >
          PANEL ADMINISTRATORA
        </div>

        {isAdminOpen && (
          <div className="sub-menu">
            <NavLink to="/admin/candidates" icon="group" label="Kandydaci" indent />
            <NavLink to="/admin/applications" icon="fact_check" label="Przegląd zgłoszeń" indent />
            <NavLink to={`/admin/applications/${previewEnrollmentId}`} icon="preview" label="Podgląd szczegółów" indent />
            <NavLink to="/admin/finances" icon="account_balance_wallet" label="Finanse" indent />
            <NavLink to="/admin/export" icon="ios_share" label="Eksport danych" indent />
          </div>
        )}
      </nav>
    </div>
  );
}