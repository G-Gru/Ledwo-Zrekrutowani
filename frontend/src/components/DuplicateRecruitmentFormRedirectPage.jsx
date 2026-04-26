import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DuplicateRecruitmentFormRedirectPage() {
    const navigate = useNavigate();

    return (  
        <div className='page-layout'>

            <div className='bg-panel' style={{padding: '30px'}}>
                <h2 style={{textAlign: 'center', marginBottom: '30px'}}> Złożyłeś już aplikację rekrutacyjną na ten przedmiot. </h2>
                <button onClick={() => navigate('/studies')}> Zobacz inne oferty studiów </button>
            </div>
        
        </div>
  );
}