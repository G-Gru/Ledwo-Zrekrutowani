// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import { logout } from '../../services/authService';

export default function Profile({}) {

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className='account-column' id='account-page-column-middle'>
            <div className='page-title'>
                Mój Profil
            </div>

            <button onClick={() => logout()}> 
                Wyloguj się
            </button>
        </div>

        <div className='account-column' id='account-page-column-right'>
            ...
        </div>
    </div>
  );
}