// src/components/ApplicationSent.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu'
import '../../styles/MyApplications.css'
import Timeline from '../../components/Timeline';
import { serverApi } from '../../services/serverApi';

function getStatusColorClass(statusText) {
    const text = statusText.toLowerCase();
    if (text.includes("brak zapłaty")) return "status-red";
    if (text.includes("oczekuje wypełnienia")) return "status-yellow";
    if (text.includes("odpowiedź")) return "status-blue";
    return "status-grey"; // domyślny
}

function getIconFromDocumentType(docType) {
    return "school"
}

export default function MyApplications({}) {
    const [activeCardId, setActiveCardId] = React.useState(null);
    const [unfinishedApplications, setUnfinishedApplications] = useState([])
    const [activeApplications, setActiveApplications] = useState([])
    
    const allApps = [...unfinishedApplications, ...activeApplications];
    const activeApp = allApps.find(app => app.id === activeCardId);
    const activeSchedule = activeApp ? activeApp.schedule : [];

    /* Karta na wyswietlenie jednego wniosku */
    const ApplicationCard = ({ 
        id, documentName, type, dataId, statuses=[], unfinished=false 
    }) => {
        const [appData, setAppData] = useState({ major: '', institute: '' });

        useEffect(() => {
            if (type === "rekr" && dataId !== null) {
                const data = serverApi.getApplicationDataFromId(dataId);
                setAppData(data);
            }
        }, [type, dataId]);

        return (
            <div 
                className={`single-application-card ${activeCardId === id ? 'active' : ''}`}
                onClick={() => setActiveCardId(id)}
            >
                <span className="material-symbols-outlined">{getIconFromDocumentType(type)}</span>

                <div style={{display: 'flex', flexDirection: 'column', flex: 1}}>
                    <h4> {documentName} </h4>
                    
                    {type === "rekr" && (
                        <>
                            <p><span className='line-item-title'>KIERUNEK:</span> {appData.major}</p>
                            <p><span className='line-item-title'>WYDZIAŁ:</span> {appData.institute}</p>
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
        // Uwaga: poprawiona składnia useEffect
        setUnfinishedApplications(serverApi.getUserUnfinishedApplications());
        setActiveApplications(serverApi.getUserActiveApplications());
    }, []);

    return (
        <div className='account-page-layout'>
            <AccountPageLeftMenu/>

            <div className='account-column' id='account-page-column-middle'>
                <div className='page-title'>Moje Wnioski</div>
                <p>Zarządzaj swoimi procesami rekrutacyjnymi i monitoruj statusy dokumentów w jednym miejscu.</p>

                {/* Dokumenty niewysłane */}
                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>Niewysłane</div>
                    {unfinishedApplications.map((app, i) => (
                        <ApplicationCard 
                            key={i}
                            id={i} 
                            documentName={app.name}
                            type={app.type}
                            dataId={app.dataId}
                            statuses={app.status}
                            unfinished={true} 
                        />
                    ))}
                </div>
                
                {/* Wnioski aktywne */}
                <div className='bg-panel application-card'>
                    <div className='section-title application-section-title'>Aktywne wnioski</div>
                    {activeApplications.map((app, i) => (
                        <ApplicationCard 
                            key={i + unfinishedApplications.length}
                            id={i + unfinishedApplications.length} 
                            documentName={app.name}
                            type={app.type}
                            dataId={app.dataId}
                            statuses={app.status}
                        />
                    ))}
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
    );
}
