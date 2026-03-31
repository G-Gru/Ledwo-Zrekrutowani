import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';

export default function MainPage() {
  const navigate = useNavigate();

  return (
    <div className='page-layout'>
        
        <h2 className='page-title'> tymczasowa nawigacja ;) </h2>

        <div className='bg-panel'> 
            <button onClick={() => navigate('/login')}>Login Page</button>
            <button onClick={() => navigate('/register')}>Register Page</button>
            <button onClick={() => navigate('/applicationForm')}>Formularz Zgloszeniowy</button>
            <button onClick={() => navigate('/applicationSent')}>Po wyslaniu Formularza</button>
            <button onClick={() => navigate('/myapplications')}>Moje Wnioski</button>
            <button onClick={() => navigate('/mypayments')}>Moje Platnosci</button>
        </div>
    </div>
  );
}