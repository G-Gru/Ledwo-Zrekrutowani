// src/components/ApplicationSent.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import '../../styles/MyApplications.css'
import Timeline from '../../components/Timeline';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import LoginRedirectPage from '../../components/LoginRedirectPage';

function getStatusColorClass(statusText) {
    const text = statusText.toLowerCase();
    if (text.includes("brak zapłaty")) return "status-red";
    if (text.includes("oczekuje wypełnienia")) return "status-yellow";
    if (text.includes("odpowiedź")) return "status-blue";
    return "status-grey";
}

function getIconFromDocumentType(docType) {
    return "school"
}

export default function MyApplications({}) {
    const [activeCardId, setActiveCardId] = React.useState(null);
    
    const [unfinishedApplications, setUnfinishedApplications] = useState([])
    const [userHasUnfinishedApplications, setUserHasUnfinishedApplications] = useState(false)
    
    const [activeApplications, setActiveApplications] = useState([])
    const [userHasActiveApplications, setUserHasActiveApplications] = useState(false)

    const [userLoggedIn, setUserLoggedIn] = useState(false)
    
    const allApps = [...unfinishedApplications, ...activeApplications];
    const activeApp = activeCardId !== null && allApps[activeCardId] ? allApps[activeCardId] : null;
    const activeSchedule = activeApp ? activeApp.schedule : [];

    const [error, setError] = useState("");


    /* Karta na wyswietlenie jednego wniosku */
    const ApplicationCard = ({ 
        id, documentName, type, studies_edition, statuses=[], unfinished=false 
    }) => {
        return (
            <div 
                className={`single-application-card ${activeCardId === id ? 'active' : ''}`}
                onClick={() => setActiveCardId(id)}
            >
                <span className="material-symbols-outlined">{unfinished ? "edit_note" : getIconFromDocumentType(type)}</span>

                <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <h4> {documentName} </h4>
                    
                    {type === "rekr" && (
                        <>
                            <p><span className='line-item-title'>KIERUNEK:</span> {studies_edition ? studies_edition.name : "Nieznany kierunek"}</p>
                            <p><span className='line-item-title'>WYDZIAŁ:</span> Nieznany Wydzial </p>
                        </>
                    )}

                    {/* Generowanie tagów statusów - każdy status jako osobny element */}
                    <div className="status-badges-container" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        {statuses.map((status, idx) => (
                            <div key={idx} className={`application-status ${getStatusColorClass(status)}`}> 
                                {status} 
                            </div>
                        ))}
                    </div>
                </div>

                {unfinished && <span className="material-symbols-outlined">chevron_right</span>}
            </div>
        );
    };

    /* Pobieranie wnioskow z servera */
    // dane: application { name: "", type: "", status: [""],  schedule: [name: "", startDate: "", endDate: "", flag: ""] }
    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setUserLoggedIn(false);
            return;
        }

        setUserLoggedIn(true);

        async function fetchApplicationData() {
            /* get unfinished applications */
            let unfinishedAppsResponse = await serverApi.getUserUnfinishedApplications(token)
            if (unfinishedAppsResponse != null) {
                setUserHasUnfinishedApplications(unfinishedAppsResponse.applications.length > 0)
                setUnfinishedApplications(unfinishedAppsResponse.applications)
                if (unfinishedAppsResponse["error"]) setError(unfinishedAppsResponse["errorMsg"]);
            }
            
            /* get active applications */
            let activeAppsResponse = await serverApi.getUserActiveApplications(token)
            if (activeAppsResponse != null && activeAppsResponse.applications) {
                setUserHasActiveApplications(activeAppsResponse.applications.length > 0)
                setActiveApplications(activeAppsResponse.applications)
                if (activeAppsResponse["error"]) setError(activeAppsResponse["errorMsg"]);
            }
        }
        fetchApplicationData();

        const watchInterval = setInterval(() => {
            if (!isLoggedIn()) {
                setUserLoggedIn(false);
            }
        }, 30000);

        return () => clearInterval(watchInterval);
    }, []);

    return (
        <div>
        { !userLoggedIn ? <LoginRedirectPage /> : (
            <div className='account-page-layout'>
                <AccountPageLeftMenu/>

                <div className='account-column' id='account-page-column-middle'>
                    {/* error msg */}
                    {error && <div className="error-message">{error}</div>}

                    {/* Title */}
                    <div className='page-title'>Moje Wnioski</div>
                    <p style={{marginLeft: '30px', marginTop: 0}}>Zarządzaj swoimi procesami rekrutacyjnymi i monitoruj statusy dokumentów w jednym miejscu.</p>

                    {/* Dokumenty niewysłane */}
                    <div className='bg-panel application-card'>
                        <div className='section-title application-section-title'>Niewysłane</div>
                        
                        { !userHasUnfinishedApplications ? (
                            <p> Nie masz żadnych niewypełnionych wniosków </p>
                        ) : (
                            unfinishedApplications.map((app, i) => (
                                <ApplicationCard 
                                    key={i}
                                    id={i} 
                                    documentName={app.name}
                                    type={app.type}
                                    studies_edition={app.studies_edition}
                                    statuses={app.status}
                                    unfinished={true} 
                                />
                            ))
                        )
                        }
                    </div>
                    
                    {/* Wnioski aktywne */}
                    <div className='bg-panel application-card'>
                        <div className='section-title application-section-title'>Aktywne wnioski</div>
                        
                        { !userHasActiveApplications ? (
                            <p> Nie masz żadnych aktywnych wniosków </p>
                        ) : (
                            activeApplications.map((app, i) => (
                                <ApplicationCard 
                                    key={i + unfinishedApplications.length}
                                    id={i + unfinishedApplications.length} 
                                    documentName={app.name}
                                    type={app.type}
                                    studies_edition={app.studies_edition}
                                    statuses={app.status}
                                />
                            ))
                        )}   
                    </div>
                </div>

                {/* Prawa kolumna - HARMONOGRAM */}
                <div className='account-column' id='account-page-column-right'>
                    {/* Przekazujemy harmonogram zależny od tego, która karta jest "active" */}
                    <Timeline schedule={activeSchedule}/>

                    <div className="right-panel help-panel">
                        <h3 className="help-title">Potrzebujesz pomocy?</h3>
                        <a href="#faq" className="help-link">
                            <span>FAQ</span>
                            <span className="material-symbols-outlined icon-small">open_in_new</span>
                        </a>
                    </div>
                </div>
            </div>
        )}
        </div>
    )
}
