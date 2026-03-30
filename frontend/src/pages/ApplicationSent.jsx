// src/components/ApplicationSent.jsx
import React from 'react';
import '../styles/Style.css';
import '../styles/ApplicationForm.css';
import { useNavigate } from 'react-router-dom';

export default function ApplicationSent({
    majorName='nazwa kierunku', 
    responseDeadline='1 stycznia 2000',
    paymentDeadline='1 stycznia 2000',
}) {
  const navigate = useNavigate();

  return (
    <div className='page-layout'>
        {/* CHECKMARK */}
        <span className="material-symbols-outlined" id="check-circle">check_circle</span>

        {/* TITLE */}
        <div className='page-title'> Pomyślnie wysłano! </div>

        {/* UNDER TITLE TEXT */}
        <p>
            Twoje zgłoszenie na kierunek <b>{majorName}</b> zostało pomyślnie wysłane. 
        </p>
        <p>
            Wyniki rekrutacji zostaną ogłoszone do dnia <b><i>{responseDeadline}</i></b>
        </p>

        {/* ACTION CARD */}
        <div className='action-card'>

            <h4 className='action-title'> 
                WYMAGANA AKCJA
            </h4>
            <h2> Opłata Rekrutacyjna </h2>
            <p>
                Aby dokończyć proces rekrutacji, należy uiścić opłatę rekrutacyjną w wysokości 
                <span style={{color:'darkred'}}><b> 100 PLN </b></span>
            </p>

            {/* TERMIN */}
            <div className='payment-deadline-info'> 
                <span class="material-symbols-outlined text-primary">event</span>
                Termin uiszczenia opłaty: <span style={{color: 'darkred'}}> {paymentDeadline} </span>
            </div>

            <div style={{width: '95%', borderTop:'1px solid #c4c4c47d', alignSelf: 'center'}}> </div>

            {/* PLATNOSCI  */}
            <p style={{fontSize: 'smaller'}}>  
                Opłatę możesz uregulować teraz lub w dowolnym momencie przed upływem terminu w sekcji 
                <b> Płatności </b> 
            </p>
            
            {/* Buttons */}
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <button onClick={() => navigate('/mypayments')}> Przejdź do płatności </button>
                <button className='button-secondary' onClick={() => navigate('/')}> Zrób to póżniej </button>
            </div>
        </div>

        {/* Moje wnioski */}
        <div className='moje-wnioski-info'>
            <span class="material-symbols-outlined">analytics</span>
            Status swojego wniosku możesz zawsze sprawdzić w sekcji 
            <span class='moje-wnioski-link' onClick={() => navigate('/myapplications')}>Moje wnioski</span>
        </div>

    </div>
  );
}