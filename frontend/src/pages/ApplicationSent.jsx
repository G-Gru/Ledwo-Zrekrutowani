import React, { useState, useEffect } from 'react';
import '../styles/ApplicationForm.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serverApi } from '../services/serverApi';
import { getAccessToken } from '../services/authService';
import { formatDateInWarsaw } from '../utils/dateTime';

const KNOWN_ENROLLMENT_STATUSES = new Set(['CANDIDATE', 'RESERVE', 'STUDENT', 'DRAFT', 'REJECTED', 'EXPELLED']);

const getPrimaryEnrollmentStatus = (status) => {
    const rawStatuses = Array.isArray(status) ? status : [status];
    for (const rawStatus of rawStatuses) {
        const normalized = String(rawStatus || '').trim().toUpperCase();
        if (KNOWN_ENROLLMENT_STATUSES.has(normalized)) {
            return normalized;
        }
    }
    return '';
};

const enrollmentResultContent = {
    CANDIDATE: {
        title: 'Status po wysłaniu: Kandydat',
        text: 'Zakwalifikowano Cię do podstawowej listy kandydatów. Kontynuuj opłatę i dostarczenie dokumentów, aby domknąć rekrutację.',
        variant: 'candidate',
    },
    RESERVE: {
        title: 'Status po wysłaniu: Lista rezerwowa',
        text: 'Aktualnie jesteś na liście rezerwowej. Jeżeli zwolni się miejsce, status może zostać automatycznie zaktualizowany.',
        variant: 'reserve',
    },
};

export default function ApplicationSent(
) {
    // TODO powinno pokazywać jakoś czy jesteśmy candidate czy tylko reserve
    const navigate = useNavigate();
    const [showPaymentCard, setShowPaymentCard] = useState(true);
    const [showDocumentCard, setShowDocumentCard] = useState(true);
    const [courseInfo, setCourseInfo] = useState({ name: "Nieznany kierunek", deadline: "-"});
    const [enrollmentStatusCode, setEnrollmentStatusCode] = useState('');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // dane kierunku i wydzialu
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('edition_id');
    
    useEffect(() => {
        const fetchCourseInfo = async () => {
            const token = getAccessToken();
            if (token && courseId) {
                const info = await serverApi.getCourseInfo(courseId);
                console.log(info)
                setCourseInfo({ name: info.name, deadline: formatDateInWarsaw(info.recruitment_end_date) });
            }
        };
        fetchCourseInfo();
    }, [courseId]);

    useEffect(() => {
        const fetchEnrollmentResult = async () => {
            const token = getAccessToken();
            if (!token || !courseId) return;

            const applicationsResult = await serverApi.getUserApplications(token);
            if (applicationsResult.error || !Array.isArray(applicationsResult.applications)) return;

            const currentEditionApplication = applicationsResult.applications.find((application) => {
                const editionId = application?.studies_edition?.id ?? application?.studies_edition;
                return String(editionId) === String(courseId);
            });

            if (!currentEditionApplication) return;

            const statusCode = getPrimaryEnrollmentStatus(currentEditionApplication.status);
            setEnrollmentStatusCode(statusCode);
        };

        fetchEnrollmentResult();
    }, [courseId]);

    const handleDismissCard = (cardSetter) => {
        cardSetter(false);
    };

    const resultInfo = enrollmentResultContent[enrollmentStatusCode] || null;


  return (
    <div className='page-layout'>
        {/* CHECKMARK */}
        <span className="material-symbols-outlined" id="check-circle">check_circle</span>

        {/* TITLE */}
        <div className='page-title'> Pomyślnie wysłano! </div>

        {/* UNDER TITLE TEXT */}
        <p>
            Twoje zgłoszenie na kierunek <b>{courseInfo.name}</b> zostało pomyślnie wysłane. 
        </p>
        {resultInfo && (
            <div className={`enrollment-result-banner ${resultInfo.variant}`}>
                <h3>{resultInfo.title}</h3>
                <p>{resultInfo.text}</p>
            </div>
        )}
        {/* <p>
            Wyniki rekrutacji zostaną ogłoszone do dnia <b><i>{courseInfo.deadline}</i></b>
        </p> */}

        {/* ACTION CARDS CONTAINER */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {/* PAYMENT ACTION CARD */}
            {showPaymentCard && (
                <div className='action-card action-card-dismiss'>
                    <h4 className='action-title'> 
                        WYMAGANA AKCJA
                    </h4>
                    <h2> Opłata Rekrutacyjna </h2>
                    <p>
                        Aby dokończyć proces rekrutacji, należy uiścić opłatę rekrutacyjną w wysokości 
                        <b> 100 PLN </b>
                    </p>

                    {/* TERMIN */}
                    <div className='payment-deadline-info'> 
                        <span className="material-symbols-outlined text-primary">event</span>
                        Termin uiszczenia opłaty: <span style={{color: 'darkred'}}> {courseInfo.deadline} </span>
                    </div>

                    <div style={{width: '95%', borderTop:'1px solid #c4c4c47d', alignSelf: 'center'}}> </div>

                    {/* PLATNOSCI  */}
                    <p style={{fontSize: 'smaller'}}>  
                        Opłatę możesz uregulować teraz lub w dowolnym momencie przed upływem terminu w sekcji 
                        <b> Płatności. </b> Jeśli planujesz rekrutacje na inne kierunki to możnesz zapłacic za ich opłaty jednocześnie.
                    </p>
                    
                    {/* Buttons */}
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <button onClick={() => navigate('/my-payments')}> Przejdź do płatności </button>
                        <button className='button-secondary' onClick={() => handleDismissCard(setShowPaymentCard)}> Zrób to później </button>
                    </div>
                </div>
            )}

            {/* DOCUMENT ACTION CARD */}
            {showDocumentCard && (
                <div className='action-card action-card-dismiss'>
                    <h4 className='action-title'> 
                        WYMAGANA AKCJA
                    </h4>
                    <h2> Dostarczenie podpisanej kopii formularza do sekretariatu, oraz orginał dyplomu </h2>
                    <p>
                        Aby dokończyć proces rekrutacji, należy przynieść wydrukowaną kopie z Twoimi wypełnionymi danymi i własnoręcznym podpisem.
                        Wzór dokumentu jest dostępny do pobrania w sekcji Moje Dokumenty.
                        Dodatkowo należy przynieść orgianał załączonego dyplomu ukończenia studiów wyższych.
                    </p>

                    {/* TERMIN */}
                    <div className='payment-deadline-info'> 
                        <span className="material-symbols-outlined text-primary">event</span>
                        Termin dostarczenia dokumentu: <span style={{color: 'darkred'}}> {courseInfo.deadline} </span>
                    </div>

                    <div style={{width: '95%', borderTop:'1px solid #c4c4c47d', alignSelf: 'center'}}> </div>

                    {/* Buttons */}
                    <div style={{display: 'flex', flexDirection: 'row'}}>
                        <button onClick={() => navigate('/my-applications')}> Przejdź do Moje wnioski </button>
                        <button className='button-secondary' onClick={() => handleDismissCard(setShowDocumentCard)}> Zrozumiałem </button>
                    </div>
                </div>
            )}
        </div>

        {/* Moje wnioski */}
        <div className='moje-wnioski-info'>
            <span className="material-symbols-outlined">analytics</span>
            Status swojego wniosku możesz zawsze sprawdzić w sekcji 
            <span className='inline-link' onClick={() => navigate('/my-applications')}>Moje wnioski</span>
        </div>

    </div>
  );
}