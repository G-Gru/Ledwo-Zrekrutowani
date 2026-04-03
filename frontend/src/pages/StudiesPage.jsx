import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';

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
        const response = await fetch('/studies/editions/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Brak danych od backendu');
        }

        setOffers(data);
        setError('');
      } catch (err) {
        console.warn('fetch /studies failed, using sample data', err);
        setError('Brak połączenia z backendem; wyświetlane dane testowe.');
        setOffers(sampleOffers);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="page-layout">
      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p>Ładowanie ofert...</p>
      ) : (
        <div className="studies-grid">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="study-card"
              onClick={() => navigate(`/studies/editions/${offer.id}`)}
              style={{ cursor: 'pointer' }}
            >
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
  );
}
