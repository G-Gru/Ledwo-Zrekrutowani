import React, { useState, useEffect, useRef } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import { formatDateInWarsaw } from '../../utils/dateTime';
import '../../styles/Payments.css';
import '../../styles/Documents.css';

export default function Documents() {

    const [systemDocumentsList, setSystemDocuments] = useState(null)
    const [error, setErrorMsg] = useState("")

    const [userToken, setUserToken] = useState(null);
    const [userLoggedIn, setUserLoggedIn] = useState(false)

    const actionColour = '#ba5414'
    const acceptedColour = '#00696f'
    const actionColourBg= actionColour + '20' // add hex code 0x60 for alpha level
    const acceptedColourBg = acceptedColour + '20'

    useEffect( () => {
        const token = getAccessToken();
        if (!token) { setUserLoggedIn(false); return; }
        setUserToken(token);
        setUserLoggedIn(true);

        async function fetchDocumentsData() {

            // system docuemnts
            var systemDocs = await serverApi.getSystemDocuments() 
            setSystemDocuments( systemDocs.documents )
            if (systemDocs.error) setErrorMsg(systemDocs.errorMsg)
        }

        fetchDocumentsData()

    }, []);

    return (
        !userLoggedIn ? <LoginRedirectPage /> : (
        
        <div className='account-page-layout'>
            <AccountPageLeftMenu/>

            <div className='payments-main-container'>

                <header className='payments-page-header'>
                    {/* error msg */}
                    {error && <div className="error-message">{error}</div>}

                    {/* Title */}
                    <div className='page-title'>Dokumenty</div>
                    {/* <p className='page-subtitle'>Monitoruj statusy opłat i wykonuj łączne transakcje w jednym miejscu.</p> */}
                </header>

                {/* Sekcja Historii */}
                <div className='history-section-wide'>
                    <div className='history-top-bar'>
                        <h2 className='history-title'>Wygenerowane przez System</h2>
                        <p> Te dokumenty nalezy przynieść podpisane do sekretariatu </p>
                    </div>

                    <div className='bg-panel history-list-container'>
                        { !systemDocumentsList || systemDocumentsList.length == 0 ? (<p style={{padding: '30px'}}> Brak wygenerowanych dokumentów </p>) : (
                            systemDocumentsList.map((item, index) => (
                                <div key={index} className='history-row-item'>
                                    <div className='row-main-info'>
                                        <div className='status-icon-circle' style={{backgroundColor: item.actionRequired ? actionColourBg : acceptedColourBg}}>
                                            <span className="material-symbols-outlined">{item.actionRequired ? "warning" : "done_all"}</span>
                                        </div>
                                        <div className='text-group' style={{textAlign:'left'}}>
                                            <div className='history-item-name'>Podanie rekrutacyjne na kierunek <i>{item.studies_name}</i></div>
                                            <div className='history-status-tag' style={{color: item.actionRequired ? actionColour : acceptedColour}}>
                                                {item.actionRequired ? "Wymaga Dostarczenia" : "Zaakceptowany"}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='row-amount-info'>
                                        <div className='history-item-sub'>Data utworzenia: {formatDateInWarsaw(item.dateUpload)}</div>
                                        { item.actionRequired ? 
                                            (<div className='history-item-sub' style={{color: actionColour, fontWeight: 850}}>Termin dostarczenia: {formatDateInWarsaw(item.dateDeadline)}</div>)
                                            : (<div className='history-item-sub' style={{color: acceptedColour}}>Termin akceptacji: {formatDateInWarsaw(item.dateAccepted)}</div>)
                                        }

                                    </div>
                                    { !item.fileUrl ? (null) : (
                                        <a href={item.fileUrl} className='btn-ghost-icon'>
                                            <span className="material-symbols-outlined">download</span>
                                        </a>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>)
    );

} 