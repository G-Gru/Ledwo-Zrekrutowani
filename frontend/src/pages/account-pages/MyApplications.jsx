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
    // if (text.includes("brak zapłaty")) return "status-red";
    // if (text.includes("oczekuje wypełnienia")) return "status-yellow";
    // if (text.includes("odpowiedź")) return "status-blue";
    if (text.includes("student")) return "status-blue status-type-main";
    if (text.includes("candidate")) return "status-yellow status-type-main";
    if (text.includes("draft")) return "status-grey status-type-main";
    if (text.includes("dokumen") || text.includes("płatno")) return "status-red";
    return "status-grey";
}

function getIconFromDocumentType(docType) {
    return "school"
}

function getStatusPolishTranslation(status) {
    console.log
    switch (status.toUpperCase()) {
        case "CANDIDATE": return "Kandydat"
        case "DRAFT": return 'Wniosek Niewysłany'
        case "RESERVE": return 'Kandydat Rezerwowy'
        case "STUDENT": return 'Student'
        case "REJECTED": return 'Wniosek Odrzucony'
        case "EXPELLED": return 'Student Wydalony'
        default: return status
    }
}

export default function MyApplications({}) {
    const [activeCardId, setActiveCardId] = React.useState(null);
    
    const [unfinishedApplications, setUnfinishedApplications] = useState([])
    const [userHasUnfinishedApplications, setUserHasUnfinishedApplications] = useState(false)
    
    const [activeApplications, setActiveApplications] = useState([])
    const [userHasActiveApplications, setUserHasActiveApplications] = useState(false)

    const [userLoggedIn, setUserLoggedIn] = useState(true)
    
    const allApps = [...unfinishedApplications, ...activeApplications];
    const activeApp = activeCardId !== null && allApps[activeCardId] ? allApps[activeCardId] : null;
    const activeSchedule = activeApp ? activeApp.schedule : [];

    const [error, setError] = useState("");
    const [resigningEnrollmentId, setResigningEnrollmentId] = useState(null);

    const navigate = useNavigate()

    async function fetchApplicationData(token) {
        const appsResponse = await serverApi.getUserApplications(token);

        if (appsResponse != null && appsResponse.applications && !appsResponse.error) {
            const draftApps = appsResponse.applications.filter(item => item.status.some(status => status.toLowerCase().includes("draft")));
            setUnfinishedApplications(draftApps);
            setUserHasUnfinishedApplications(draftApps.length > 0);

            const activeApps = appsResponse.applications.filter(item => !item.status.some(status => status.toLowerCase().includes("draft")));
            setUserHasActiveApplications(activeApps.length > 0);
            setActiveApplications(activeApps);
            setError("");
        } else {
            setError(appsResponse?.errorMsg || 'Nie udało się pobrać wniosków.');
        }
    }

    const handleResignEnrollment = async (application) => {
        const token = getAccessToken();
        if (!token || !application?.id) {
            setError('Brak uprawnień lub identyfikatora wniosku do rezygnacji.');
            return;
        }

        const studyName = application?.studies_edition?.name || 'tego kierunku';
        const shouldResign = window.confirm(
            `Czy na pewno chcesz zrezygnować z rekrutacji/studiów dla: ${studyName}?\n\nTej operacji nie da się cofnąć.`
        );
        if (!shouldResign) return;

        setResigningEnrollmentId(application.id);
        setError('');

        try {
            const result = await serverApi.resignFromEnrollment(token, application.id);
            if (result.error) {
                setError(result.errorMsg || 'Nie udało się zrezygnować ze zgłoszenia.');
                return;
            }

            if (activeCardId !== null) {
                setActiveCardId(null);
            }

            await fetchApplicationData(token);
        } finally {
            setResigningEnrollmentId(null);
        }
    };


    /* Karta na wyswietlenie jednego wniosku */
    const ApplicationCard = ({ 
        id, keyId, documentName, type, studies_edition, statuses=[], unfinished=false, isPaymentComplete=false, onResign, isResigning=false
    }) => {
        return (
            <div 
                className={`single-application-card ${activeCardId === keyId ? 'active' : ''}`}
                onClick={() => setActiveCardId(keyId)}
                style={{display: 'flex', flexDirection: 'column' }}
            >   
                {/* Info wniosku podsatwowe */}
                <div className="application-card-row">
                    <span className="material-symbols-outlined application-card-icon">
                        {unfinished ? "edit_note" : getIconFromDocumentType(type)}
                    </span>

                    <div className="application-card-info">
                        <h4>{documentName}</h4>
                        <p>
                            <span className='line-item-title'>KIERUNEK:</span> {studies_edition ? studies_edition.name : "Nieznany kierunek"}
                        </p>
                    </div>

                    {/* Statusy */}
                    <div className="status-badges-container">
                        { !unfinished ? 
                            statuses.map((status, idx) => ( <>
                                { getStatusColorClass(status) === 'status-red' ? 
                                    <div key={idx} style={{ justifyContent:'center' }}className={`application-warning`}>
                                        <span className="material-symbols-outlined status-icon">
                                            warning
                                        </span>
                                        {getStatusPolishTranslation(status)}
                                    </div> :
                                    <div key={idx} style={{ justifyContent:'center' }}className={`application-status ${getStatusColorClass(status)}`}>
                                        {getStatusPolishTranslation(status)}
                                    </div>
                                } </>
                            ))
                        :  <div className={`application-status ${getStatusColorClass("draft")}`}> Wniosek niewypełniony </div>
                        }
                    </div>

                    {unfinished && 
                        <span className="material-symbols-outlined application-card-chevron"
                            onClick={() => navigate(`/applicationForm?edition_id=${studies_edition.id}`)}
                            style={{cursor: 'pointer'}}
                        >
                            chevron_right
                        </span> 
                    }
                </div>

                {/* Linki do platnosci i dokumentow */}
                { !studies_edition ? null : (
                    <div className="application-card-actions">
                        { !unfinished && !isPaymentComplete ? (
                            <div className="docs-inline-link" 
                                onClick={ () => { navigate(`/my-payments`) }}
                            >
                                Przejdź do strony płatności
                            </div>
                        ) : null}
                        
                        { !unfinished ? (
                            <div className="docs-inline-link" 
                                onClick={ () => { navigate(`/my-documents?enrollment_id=${id}`) }}
                            >
                                Przejdź do dokumentów tego wniosku
                            </div>
                        ) : null}

                        <button
                            type="button"
                            className="docs-inline-link application-resign-link"
                            disabled={isResigning}
                            onClick={(e) => {
                                e.stopPropagation();
                                onResign?.();
                            }}
                        >
                            {isResigning ? 'Rezygnacja...' : 'Rezygnuj z kierunku'}
                        </button>
                    </div>
                )}
            </div>
        )
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

        fetchApplicationData(token);

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
                                    keyId={i}
                                    id={app.id}
                                    documentName={app.name}
                                    studies_edition={app.studies_edition}
                                    statuses={app.status}
                                    unfinished={true}
                                    isResigning={resigningEnrollmentId === app.id}
                                    onResign={() => handleResignEnrollment(app)}
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
                                    keyId={i + unfinishedApplications.length}
                                    id={app.id}
                                    documentName={app.name}
                                    type={app.type}
                                    studies_edition={app.studies_edition}
                                    statuses={app.status}
                                    isPaymentComplete={app.isPaymentComplete}
                                    isResigning={resigningEnrollmentId === app.id}
                                    onResign={() => handleResignEnrollment(app)}
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
                        <div onClick={() => navigate('/faq')} className="docs-inline-link faq">
                            FAQ <span className="material-symbols-outlined icon-small">open_in_new</span>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </div>
    )
}
