import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useState, useEffect } from 'react';
import { getUserType, isLoggedIn } from '../services/authService';

export default function Header() {
    const location = useLocation();
    const pathname = location.pathname;

    const isActive = (path) => pathname === path;
    const isStudiesActive = pathname === '/studies' || pathname.startsWith('/studies/editions/');
    const isAccountActive = pathname.startsWith('/my-');

    const isAdminSectionActive = pathname === '/admin/export' || pathname === '/admin/finances';
    const isRecruitmentPanelActive = pathname.startsWith('/admin/candidates') || pathname.startsWith('/admin/applications');
    const isCoordinatorPanelActive = pathname.startsWith('/manage-studies');

    const [isUserLoggedIn, setUserLoggedIn] = useState(false);
    const [userType, setUserType] = useState(null);

    useEffect(() => {
        const checkLoginStatus = () => {
            setUserLoggedIn(isLoggedIn());
            setUserType(getUserType());
        };

        checkLoginStatus();
        const interval = setInterval(checkLoginStatus, 1000);

        return () => { clearInterval(interval); };
    }, [location.pathname]);

    const canSeeRecruitmentPanel = userType === 'ADMIN' || userType === 'EMPLOYEE';
    const canSeeCoordinatorPanel = userType === 'ADMIN' || userType === 'EMPLOYEE';
    const canSeeAdminPanel = userType === 'ADMIN';

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
            {canSeeRecruitmentPanel && (
                <Link to='/admin/candidates' className={`btn btn-secondary ${isRecruitmentPanelActive ? 'active' : ''}`}>
                    Panel Rekrutacji
                </Link>
            )}
            {canSeeCoordinatorPanel && (
                <Link to='/manage-studies' className={`btn btn-secondary ${isCoordinatorPanelActive ? 'active' : ''}`}>
                    Panel Koordynatora
                </Link>
            )}
            {canSeeAdminPanel && (
                <Link to='/admin/export' className={`btn btn-secondary ${isAdminSectionActive ? 'active' : ''}`}>
                    Panel Admina
                </Link>
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

