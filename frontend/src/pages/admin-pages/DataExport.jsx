// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'

export default function DataExport({}) {

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className='account-column' id='account-page-column-middle'>
            <div className='page-title'>
                Eksport Danych
            </div>
        </div>

        <div className='account-column' id='account-page-column-right'>
            ...
        </div>
    </div>
  );
}