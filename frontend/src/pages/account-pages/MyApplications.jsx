// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import '../../styles/MyApplications.css'

export default function MyApplications({}) {
    const [activeCardId, setActiveCardId] = React.useState(null);

    const ApplicationCard = ({ 
        id,
        documentName='dokument wysłany przez użytkownika', 
        major='kierunek', 
        institute='wydział', 
        icon='school', 
        statusText='Awaiting result',
        statusId='none',
        unfinished = false 
    }) => (
        <div 
            className={`single-application-card ${activeCardId === id ? 'active' : ''}`}
            onClick={() => setActiveCardId(id)}
        >
            <span className="material-symbols-outlined">{icon}</span>

            <div style={{display: 'flex', flexDirection: 'column'}}>
                <h4> {documentName} </h4>
                <p> <span className='line-item-title'>KIERUNEK:</span> {major} </p>
                <p> <span className='line-item-title'>WYDZIAŁ:</span> {institute} </p>
            </div>

            <div className='application-status' id={'application-status-'+statusId}> 
                {statusText} 
            </div>

            {!unfinished ? null : 
                <span className="material-symbols-outlined">chevron_right</span>
            }
        </div>
    );

    return (
        <div className='account-page-layout'>
            <AccountPageLeftMenu/>

            <div className='account-column' id='account-page-column-middle'>
                <div className='page-title'>
                    Moje Wnioski
                </div>
                <p> Zarządzaj swoimi procesami rekrutacyjnymi i monitoruj statusy dokumentów w jednym miejscu. </p>

                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>
                        Niewysłane
                    </div>
                    <ApplicationCard id="card-1" unfinished={true} statusText='Oczekuje wypełnienia' statusId='unfinished'/>
                </div>
                
                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>
                        Aktywne wnioski
                    </div>
                    <ApplicationCard id="card-2" statusText='Oczekuje odpowiedzi' statusId='document'/>
                    <ApplicationCard id="card-3" statusText='Brak zapłaty' statusId='payment'/>
                </div>
            </div>

            <div className='account-column' id='account-page-column-right'>
                ...
            </div>
        </div>
    );
}
