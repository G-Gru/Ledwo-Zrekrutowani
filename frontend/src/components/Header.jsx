import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';
import { useState, useEffect } from 'react';

export default function Header() {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const [isUserLoggedIn, setUserLoggedIn] = useState(false)

    useEffect(() => {
        // check user is logged in
        const checkLoginStatus = () => {
            setUserLoggedIn(localStorage.getItem("user-access-token") != null);
        };
        checkLoginStatus();
        const interval = setInterval(checkLoginStatus, 250); // check every 250ms for login state

        return () => { clearInterval(interval); };
    }, []);

    return (
        <header className="header">
        <div className="header-container">
            <Link to="/studies" className="logo">
            <img src="/assets/logo.png" alt="Logo" onError={(e) => e.target.style.display = 'none'} />
            </Link>
            <nav className="nav-buttons">
            <Link to="/studies" className={`btn btn-secondary ${isActive('/studies') ? 'active' : ''}`}>
                Oferty Studiów
            </Link>
            <Link to={isUserLoggedIn ? "/my-profile" : "/login"} className={`btn btn-primary ${(!isUserLoggedIn && isActive('/login')) || (isUserLoggedIn&&isActive('/my-profile')) ? 'active' : ''}`}>
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

