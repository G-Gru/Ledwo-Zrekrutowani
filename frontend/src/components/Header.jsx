import { Link, useLocation } from 'react-router-dom';
import '../styles/Header.css';

export default function Header() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

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
          <Link to="/login" className={`btn btn-primary ${isActive('/login') ? 'active' : ''}`}>
            Logowanie
          </Link>
        </nav>
      </div>
    </header>
  );
}

