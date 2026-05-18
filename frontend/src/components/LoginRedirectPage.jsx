import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LoginRedirectPage({}) {
    const navigate = useNavigate();
    const location = useLocation();

    return (  
        <div className='page-layout'>

            <div className='bg-panel' style={{padding: '30px'}}>
                <h2 style={{textAlign: 'center', marginBottom: '30px'}}> Musisz być zalogowany żeby wyświetlić tę stronę. </h2>
                <button onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`)}> Zaloguj się </button>
            </div>
        
        </div>
  );
}