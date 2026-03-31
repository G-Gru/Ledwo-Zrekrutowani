// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'

export default function Finances({}) {

  return (
    <div className='account-page-layout'>
        <AccountPageLeftMenu/>

        <div className='account-column' id='account-page-column-middle'>
            <div className='page-title'>
                Finanse
            </div>
        </div>

        <div className='account-column' id='account-page-column-right'>
            ...
        </div>
    </div>
  );
}