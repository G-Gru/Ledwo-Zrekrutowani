import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Style.css';

const sampleEdition = {
  id: 1,
  price: '5000.00',
  start_date: '1.10.2024',
  end_date: '30.06.2028',
  max_participants: 50,
  status: 'ACTIVE',
  syllabus_url: 'https://example.com/syllabus/informatyka',
  recruitment_start_date: '2024-05-01T00:00:00Z',
  recruitment_end_date: '2024-09-30T23:59:59Z',
  name: 'Informatyka',
  terms_count: 7,
  description: 'Programowanie, bazy danych, systemy operacyjne. Nauczysz się tworzyć aplikacje webowe, mobilne i desktopowe.',
};

export default function StudiesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edition, setEdition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/studies/editions/${id}/`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        setEdition(data);
      } catch (err) {
        console.warn('Error fetching edition details:', err);
        setEdition(sampleEdition);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="page-layout"><p>Ładowanie...</p></div>;
  if (!edition) return <div className="page-layout"><p>Edycja nie znaleziona.</p></div>;

  const recruitmentStart = edition.recruitment_start_date
    ? new Date(edition.recruitment_start_date).toLocaleDateString()
    : '-';
  const recruitmentEnd = edition.recruitment_end_date
    ? new Date(edition.recruitment_end_date).toLocaleDateString()
    : '-';

  return (
    <div className="page-layout">
      <h2 className="page-title">{edition.name}</h2>

      <div className="detail-grid">
        <div className="detail-main-column">
          <section className="detail-main-card">
            <h3 className="section-title">Program kształcenia</h3>
            <p>{edition.description || 'Brak opisu programu.'}</p>
            <a href={edition.syllabus_url || '#'} className="button-primary" target="_blank" rel="noopener noreferrer">
              Zobacz sylabus
            </a>
          </section>

          <div className="detail-bottom-grid">
            <div className="detail-box recruitment-box">
              <h4>Rekrutacja</h4>
              <hr />
              <div className="date-row">
                <p className="date-label">Początek</p>
                <p className="date-value">{recruitmentStart}</p>
              </div>
              <div className="date-divider"></div>
              <div className="date-row">
                <p className="date-label">Koniec</p>
                <p className="date-value">{recruitmentEnd}</p>
              </div>
            </div>
            <div className="detail-box terms-box">
              <h4>Terminy studiów</h4>
              <hr />
              <div className="date-row">
                <p className="date-label">Rozpoczęcie</p>
                <p className="date-value">{edition.start_date || '-'}</p>
              </div>
              <div className="date-divider"></div>
              <div className="date-row">
                <p className="date-label">Zakończenie</p>
                <p className="date-value">{edition.end_date || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="detail-side-cards">
          <div className="detail-box">
            <h4>Cena</h4>
            <p>{edition.price ? `${edition.price} PLN` : '-'}</p>
          </div>
          <div className="detail-box">
            <h4>Semestrów</h4>
            <p>{edition.terms_count ?? '-'} </p>
          </div>
          <div className="detail-box">
            <h4>Limit uczestników</h4>
            <p>{edition.max_participants ?? '-'}</p>
          </div>
          <div className="detail-box status-box">
            <h4>Status</h4>
            <p>{edition.status ?? '-'}</p>
          </div>
        </aside>
      </div>

      <div className="apply-section">
        <button
          className="button-primary apply-button"
          onClick={() => navigate(`/applicationForm?edition_id=${edition.id}`)}
        >
          Rekrutuj się
        </button>
      </div>
    </div>
  );
}