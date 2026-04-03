// src/components/ApplicationSent.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import '../../styles/MyApplications.css'

export default function MyApplications({}) {
    const [activeCardId, setActiveCardId] = React.useState(null);

    /* Karta na wyswietlenie jednego wniosku */
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

                {/* Dokumenty niewyslane */}
                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>
                        Niewysłane
                    </div>
                    <ApplicationCard id="card-1" unfinished={true} statusText='Oczekuje wypełnienia' statusId='unfinished'/>
                </div>
                
                {/* Wnioski aktywne */}
                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>
                        Aktywne wnioski
                    </div>
                    <ApplicationCard id="card-2" statusText='Oczekuje odpowiedzi' statusId='document'/>
                    <ApplicationCard id="card-3" statusText='Brak zapłaty' statusId='payment'/>
                </div>
            </div>

            <div className='account-column' id='account-page-column-right'>
                {/* Panel Harmonogramu */}
                <div className="right-panel harmonogram-panel">
                    <h3 className="panel-title text-gold">HARMONOGRAM REKRUTACJI</h3>
                    
                    <div className="timeline-container">
                        {/* To jest ta główna linia, która ciągnie się do samego dołu */}
                        <div className="timeline-line"></div>

                        <div className="timeline-item completed">
                            <div className="timeline-icon bg-teal">
                                <span className="material-symbols-outlined">check</span>
                            </div>
                            <div className="timeline-content">
                                <h4>SKŁADANIE WNIOSKÓW</h4>
                                <p>Zakończono: 10 Października</p>
                            </div>
                        </div>

                        <div className="timeline-item in-progress">
                            <div className="timeline-icon bg-yellow">
                                <span className="material-symbols-outlined">sync</span>
                            </div>
                            <div className="timeline-content">
                                <h4>WERYFIKACJA DOKUMENTÓW</h4>
                                <p className="text-yellow">W toku: Przewidywany koniec 20 Paź</p>
                            </div>
                        </div>

                        <div className="timeline-item upcoming">
                            <div className="timeline-icon bg-grey"></div>
                            <div className="timeline-content">
                                <h4>OGŁOSZENIE WYNIKÓW</h4>
                                <p>25 Października</p>
                            </div>
                        </div>

                        <div className="timeline-item upcoming">
                            <div className="timeline-icon bg-grey"></div>
                            <div className="timeline-content">
                                <h4>WPIS NA STUDIA</h4>
                                <p>Listopad 2023</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Pomocy */}
                <div className="right-panel help-panel">
                    <h3 className="help-title">Potrzebujesz pomocy?</h3>
                    
                    <a href="#faq" className="help-link">
                        <span>FAQ</span>
                        <span className="material-symbols-outlined icon-small">open_in_new</span>
                    </a>
                    
                    <a href="#message" className="help-link">
                        <span>WYŚLIJ WIADOMOŚĆ DO KOORDYNATORA</span>
                        <span className="material-symbols-outlined icon-small">mail</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
