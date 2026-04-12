// src/components/ApplicationSent.jsx
import React, { useEffect, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { getUser, isLoggedIn, logout } from '../../services/authService';

export default function Profile({}) {
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '' });
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    setUserLoggedIn(isLoggedIn());
    const interval = setInterval(() => setUserLoggedIn(isLoggedIn()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className="page-layout">
            <div className='page-title'>
                Mój Profil
            </div>

            <div className='bg-panel' style={{padding: '5px 20px'}}>
                <p><strong>Imię:</strong> {user.firstName || 'Brak danych'}</p>
                <p><strong>Nazwisko:</strong> {user.lastName || 'Brak danych'}</p>
                <p><strong>Email:</strong> {user.email || 'Brak danych'}</p>
            </div>

            <button onClick={() => logout()}> 
                Wyloguj się
            </button>
        </div>

    </div>
  );
}