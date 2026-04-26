import React, { useEffect, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { getUser, isLoggedIn, logout } from '../../services/authService';
import '../../styles/Profile.css'

export default function Profile({}) {
    const [user, setUser] = useState({ firstName: '', lastName: '', email: '' , type: ''});
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

    const TitledField = ({title, value}) => {
        return (
            <div className='titled-field'>
                <p className='item-title'> {title} </p>
                <p className='item-value'> {value} </p>
            </div>
        )
    }

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className="page-layout">
            <div className='page-title'>
                Mój Profil
            </div>

            <div className='bg-panel' style={{padding: '5px 20px'}}>

                <div className='profile-section-1'> 
                    <img src='/profile.png' />
                    <div className='profile-main-data'>
                        <p className='profile-full-name'> {user.first_name} {user.last_name} </p>
                        {/* <p className='profile-status'> {user.type} </p> */}
                        <p className='student-studies'> {user.type} </p>
                    </div>
                </div>

                <div className='profile-section-2'>
                    <p className='title'> Dane Osobowe </p>
                    <TitledField title={"Imię"} value={user.first_name || 'Brak danych'} />
                    <TitledField title={"Nazwisko"} value={user.last_name || 'Brak danych'} />
                    <TitledField title={"Email"} value={user.email || 'Brak danych'} />
                </div>
            </div>

            <button onClick={() => logout()}> 
                Wyloguj się
            </button>
        </div>

    </div>
  );
}