// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'

export default function Candidates({}) {

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className='account-column' id='account-page-column-middle'>
            <div className='page-title'>
                Kandydaci
            </div>
        </div>

        <div className='account-column' id='account-page-column-right'>
            ...
        </div>
    </div>
  );
}