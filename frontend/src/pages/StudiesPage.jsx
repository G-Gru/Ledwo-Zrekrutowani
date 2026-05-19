import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';
import { serverApi } from '../services/serverApi';

const CARD_IMAGES = [
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80', // kod na ekranie
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=600&q=80',    // cyberbezpieczeństwo
  'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&q=80', // analiza danych
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',    // edytor kodu
  'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80', // zielony kod / matrix
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80', // VR / nowe technologie
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', // płyta główna / hardware
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=600&q=80', // laptop programowanie
];

const PAGE_BG_IMAGE = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1920&q=60';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const sampleOffers = [
  { id: 1, name: 'Informatyka', price: '5000.00', start_date: '2024-10-01', status: 'ACTIVE' },
  { id: 2, name: 'Analiza Danych', price: '4800.00', start_date: '2024-11-01', status: 'ACTIVE' },
  { id: 3, name: 'Cyberbezpieczeństwo', price: '5500.00', start_date: '2025-01-15', status: 'ACTIVE' },
];

export default function StudiesPage() {
  const [offers, setOffers] = useState(sampleOffers);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await serverApi.getCoursesInfo()
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Brak danych od backendu');
        }

        setOffers(data);
        setError('');
      } catch (err) {
        console.warn('fetch /api/studies/editions failed, using sample data', err);
        setError('Brak połączenia z backendem; wyświetlane dane testowe.');
        setOffers(sampleOffers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="studies-page-bg" style={{ backgroundImage: `url('${PAGE_BG_IMAGE}')` }}>
      <div className="page-layout studies-page-content">
        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <p style={{ color: '#fff' }}>Ładowanie ofert...</p>
        ) : (
          <div className="studies-grid">
            {offers.map((offer, index) => (
              <div
                key={offer.id}
                className="study-card"
                onClick={() => navigate(`/studies/editions/${offer.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className="study-card-image"
                  style={{ backgroundImage: `url('${CARD_IMAGES[index % CARD_IMAGES.length]}')` }}
                />
                <div className="study-card-content">
                  <h3>{offer.name}</h3>
                  <p><strong>Cena:</strong> {offer.price} PLN</p>
                  <p><strong>Rozpoczęcie:</strong> {offer.start_date}</p>
                  <p><strong>Status:</strong> {offer.status}</p>
                  <span className="study-link-text">Zobacz szczegóły</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
