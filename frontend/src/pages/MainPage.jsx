import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div className='page-layout'>
        
        <h2 className='page-title'> tymczasowa nawigacja ;) </h2>

        <div className='bg-panel'> 
            <button onClick={() => navigate('/studies')}>Strona Główna - Oferty Studiów</button>
            <button onClick={() => navigate('/manage-studies')}>Zarządzanie ofertami studiów</button>
            <button onClick={() => navigate('/login')}>Login Page</button>
            <button onClick={() => navigate('/register')}>Register Page</button>
            <button onClick={() => navigate('/applicationForm?edition_id=1')}>Formularz Zgloszeniowy</button>
            <button onClick={() => navigate('/applicationSent?edition_id=1')}>Po wyslaniu Formularza</button>
            <button onClick={() => navigate('/my-applications')}>Moje Wnioski</button>
            <button onClick={() => navigate('/my-payments')}>Moje platnosci</button>
            <button onClick={() => navigate('/my-documents')}>Moje dokumenty</button>
            <button onClick={() => navigate('/my-profile')}>Profil</button>
            <button onClick={() => navigate('/admin/candidates')}>Admin Kandydaci</button>
            <button onClick={() => navigate('/admin/applications')}>Admin przegląd zgłoszeń</button>
            <button onClick={() => navigate('/admin/finances')}>Admin finananse</button>
            <button onClick={() => navigate('/admin/export')}>Admin eksport danych</button>
        </div>
    </div>
  );
}