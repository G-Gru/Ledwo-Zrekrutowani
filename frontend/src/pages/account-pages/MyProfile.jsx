import React, { useEffect, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { getUser, getAccessToken, isLoggedIn, logout } from '../../services/authService';
import { serverApi } from '../../services/serverApi';
import PasswordChangePanel from '../../components/PasswordChangePanel';
import '../../styles/Profile.css'

export default function Profile({}) {
    const [user, setUser] = useState({ firstName: '', lastName: '', email: '' , type: ''});
    const [userLoggedIn, setUserLoggedIn] = useState(true);
    const [showPasswordChange, setShowPasswordChange] = useState(false)

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
        const token = getAccessToken();
        serverApi.getCurrentUser(token).then(result => {
            if (!result.error && result.data) {
                const fresh = result.data;
                setUser(prev => ({ ...prev, ...fresh }));
                localStorage.setItem('user-data', JSON.stringify({ ...currentUser, ...fresh }));
            }
        });
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

    function userRoleStyling(role) {
        if (!role) return "status-grey"

        switch (role.toUpperCase()) {
            case 'CANDIDATE': return "status-yellow" 
            default: return "status-blue"
        }
    }
    function userRolePolishTranslation(role) {
        if (!role) return role

        switch (role.toUpperCase()) {
            case "ADMIN": return "Administrator Systemu"
            case "EMPLOYEE": return "Pracownik"
            case 'STUDIES_DIRECTOR': return "Dyrektor Kierunku"
            case 'ADMINISTRATIVE_COORDINATOR': return "Koordynator Administracyjny"
            case 'FINANCE_COORDINATOR': return "Koordynator Finansowy"
            case 'CANDIDATE': return "Kandydat" 
            // student jest juz tak samo po polsku
            default: return role
        }
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
                    <img src='/profile.svg' width={150}/>
                    <div className='profile-main-data'>
                        <p className='profile-full-name'> {user.first_name} {user.last_name} </p>
                        {/* <p className='profile-status'> {user.type} </p> */}
                        <p className={'student-studies ' + userRoleStyling(user.role)}> {userRolePolishTranslation(user.role)} </p>
                    </div>
                </div>

                <div className='profile-section-2'>
                    <p className='title'> Dane Osobowe </p>
                    <TitledField title={"Imię"} value={user.first_name || 'Brak danych'} />
                    <TitledField title={"Nazwisko"} value={user.last_name || 'Brak danych'} />
                    <TitledField title={"Email"} value={user.email || 'Brak danych'} />
                    <TitledField title={"Numer telefonu"} value={user.phone || 'Brak danych'} />
                </div>
            </div>

            { showPasswordChange && <PasswordChangePanel onPasswordSuccessfullyChanged={()=>{setShowPasswordChange(false)}} />}

            <div className='account-buttons'>
                <button onClick={() => setShowPasswordChange(!showPasswordChange)}> 
                    {showPasswordChange ? "Wyłącz zmiane hasła" : "Zmień Hasło" }
                </button>

                <button onClick={() => logout()}> 
                    Wyloguj się
                </button>
            </div>
        </div>

    </div>
  );
}