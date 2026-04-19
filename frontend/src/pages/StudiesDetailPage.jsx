import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/Style.css';
import { serverApi } from '../services/serverApi';
import { formatDateInWarsaw } from '../utils/dateTime';

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

const sampleStaff = [
  {
    id: 1,
    role: 'STUDIES_DIRECTOR',
    user: {
      first_name: 'Anna',
      last_name: 'Kowalska',
      email: 'anna.kowalska@agh.edu.pl',
      phone: '+48 600 111 222',
    },
  },
  {
    id: 2,
    role: 'ADMINISTRATIVE_COORDINATOR',
    user: {
      first_name: 'Piotr',
      last_name: 'Nowak',
      email: 'piotr.nowak@agh.edu.pl',
      phone: '+48 600 333 444',
    },
  },
  {
    id: 3,
    role: 'FINANCE_COORDINATOR',
    user: {
      first_name: 'Magdalena',
      last_name: 'Wiśniewska',
      email: 'magdalena.wisniewska@agh.edu.pl',
      phone: '+48 600 555 666',
    },
  },
];

const roleLabels = {
  STUDIES_DIRECTOR: 'Kierownik studiów',
  ADMINISTRATIVE_COORDINATOR: 'Koordynator administracyjny',
  FINANCE_COORDINATOR: 'Koordynator finansowy',
};
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function StudiesDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [edition, setEdition] = useState(null);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [editionRes, staffRes] = await Promise.all([
          serverApi.apiRequest(`/api/studies/editions/${id}/`),
          serverApi.apiRequest(`/api/studies/editions/${id}/staff/`),
        ]);

        if (editionRes.error) {
          throw new Error(`HTTP ${editionRes.errorMsg}`);
        }

        setEdition(editionRes.data);

        if (!staffRes.error && Array.isArray(staffRes.data)) {
          setStaff(staffRes.data);
        } else {
          setStaff([]);
        }
      } catch (err) {
        console.warn('Error fetching edition details:', err);
        setEdition(sampleEdition);
        setStaff(sampleStaff);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="page-layout"><p>Ładowanie...</p></div>;
  if (!edition) return <div className="page-layout"><p>Edycja nie znaleziona.</p></div>;

  const recruitmentStart = edition.recruitment_start_date
    ? formatDateInWarsaw(edition.recruitment_start_date)
    : '-';
  const recruitmentEnd = edition.recruitment_end_date
    ? formatDateInWarsaw(edition.recruitment_end_date)
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
                <p className="date-value">{formatDateInWarsaw(edition.start_date)}</p>
              </div>
              <div className="date-divider"></div>
              <div className="date-row">
                <p className="date-label">Zakończenie</p>
                <p className="date-value">{formatDateInWarsaw(edition.end_date)}</p>
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

      <section className="detail-staff-section" aria-label="Zespół edycji studiów">
        <h3 className="section-title">Zespół edycji</h3>
        <div className="detail-staff-table-wrapper">
          <table className="styled-table detail-staff-table">
            <thead>
              <tr>
                <th scope="col">Rola</th>
                <th scope="col">Imię i nazwisko</th>
                <th scope="col">E-mail</th>
                <th scope="col">Telefon</th>
              </tr>
            </thead>
            <tbody>
              {staff.length > 0 ? (
                staff.map((member) => {
                  const fullName = [member?.user?.first_name, member?.user?.last_name]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <tr key={member.id}>
                      <td>{roleLabels[member.role] || member.role || '-'}</td>
                      <td>{fullName || '-'}</td>
                      <td>{member?.user?.email || '-'}</td>
                      <td>{member?.user?.phone || '-'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4}>Brak przypisanego personelu dla tej edycji.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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