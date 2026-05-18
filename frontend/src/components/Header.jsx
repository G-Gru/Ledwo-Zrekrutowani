import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useState, useEffect } from 'react';
import { getUserRole, isLoggedIn } from '../services/authService';

export default function Header() {
    const location = useLocation();
    const pathname = location.pathname;

    const isActive = (path) => pathname === path;
    const isStudiesActive = pathname === '/studies' || pathname.startsWith('/studies/editions/');
    const isAccountActive = pathname === '/my-profile'

    const isAdminPanelActive = pathname === '/manage-studies/offers' || pathname === '/manage-studies/editions';
    const isCoordinatorPanelActive = 
      pathname.startsWith('/admin/candidates') || 
      pathname.startsWith('/admin/applications') || 
      pathname.startsWith('/admin/export');
    const isFinancePanelActive = pathname === '/admin/finances';

    const isApplicationsPanelActive = pathname === '/my-applications' 
    const isPaymentsPanelActive = pathname === '/my-payments';

    const [isUserLoggedIn, setUserLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const checkLoginStatus = () => {
            setUserLoggedIn(isLoggedIn());
            setUserRole(getUserRole());
        };

        checkLoginStatus();
        const interval = setInterval(checkLoginStatus, 1000);

        return () => { clearInterval(interval); };
    }, [location.pathname]);

    const canSeeCoordinatorPanel = 
      userRole === 'STUDIES_DIRECTOR' || 
      userRole === 'ADMINISTRATIVE_COORDINATOR' || 
      userRole === 'ADMIN';
    
    const canSeeFinancePanel = 
      userRole === 'FINANCE_COORDINATOR' || 
      userRole === 'ADMIN';

    const canSeeCandidatePanels = 
      userRole === "STUDENT" ||
      userRole === "CANDIDATE"
    
    const canSeeAdminPanel = userRole === 'ADMIN';

    return (
        <header className="header">
        <div className="header-container">
            <Link to="/studies" className="logo">
            <img src="/assets/logo.png" alt="Logo" onError={(e) => e.target.style.display = 'none'} />
            </Link>
            <nav className="nav-buttons">
            <Link to="/studies" className={`btn btn-secondary ${isStudiesActive ? 'active' : ''}`}>
                Oferty Studiów
            </Link>
            {canSeeCoordinatorPanel && (
                <Link to='/admin/candidates' className={`btn btn-secondary ${isCoordinatorPanelActive ? 'active' : ''}`}>
                    Panel koordynatora
                </Link>
            )}
            {canSeeFinancePanel && (
                <Link to='/admin/finances' className={`btn btn-secondary ${isFinancePanelActive ? 'active' : ''}`}>
                    Panel finansowy
                </Link>
            )}
            {canSeeAdminPanel && (
                <Link to='/manage-studies/editions' className={`btn btn-secondary ${isAdminPanelActive ? 'active' : ''}`}>
                    Panel administratora
                </Link>
            )}
            {canSeeCandidatePanels && ( <>
                <Link to='/my-applications' className={`btn btn-secondary ${isApplicationsPanelActive ? 'active' : ''}`}>
                    Moje Wnioski
                </Link>
                <Link to='/my-payments' className={`btn btn-secondary ${isPaymentsPanelActive ? 'active' : ''}`}>
                    Płatności
                </Link>
                </>
            )}
            
            <Link to={isUserLoggedIn ? "/my-profile" : "/login"} className={`btn btn-primary ${(!isUserLoggedIn && isActive('/login')) || (isUserLoggedIn && isAccountActive) ? 'active' : ''}`}>
                { isUserLoggedIn ? (
                    <span className="material-symbols-outlined text-primary profile-icon">person</span>
                    ) : <div> Logowanie </div>
                }
            </Link>
            </nav>
        </div>
        </header>
    );
}

