import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import '../../styles/AdminCandidates.css';

const ENABLE_DEV_AUTH_BYPASS = true;

function mapStatus(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (['STUDENT', 'ACCEPTED', 'ZAAKCEPTOWANE'].includes(normalized)) {
    return { value: 'accepted', label: 'Zaakceptowany na studia', className: 'candidate-status accepted' };
  }
  if (['EXPELLED', 'REJECTED', 'ODRZUCONY', 'ODRZUCONE'].includes(normalized)) {
    return { value: 'rejected', label: 'Wykreślony / Odrzucony', className: 'candidate-status rejected' };
  }
  return { value: 'in-progress', label: 'W trakcie', className: 'candidate-status in-progress' };
}

export default function Candidates() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [studiesFilter, setStudiesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    setIsBypassMode(!token && bypassEnabled);
    setUserLoggedIn(!!token || bypassEnabled);

    if (!token && !bypassEnabled) {
      return;
    }

    async function fetchCandidates() {
      setLoading(true);
      setError('');

      const response = await serverApi.getAdminEnrollments(token);

      if (response.error) {
        setCandidates([]);
        setIsMockData(false);
        setError(response.errorMsg || 'Wystąpił błąd podczas pobierania kandydatów.');
      } else {
        const baseList = response.enrollments || [];
        const details = await Promise.all(
          baseList.map((item) => serverApi.getAdminEnrollmentDetails(token, item.id))
        );

        const enriched = baseList.map((item, index) => ({
          ...item,
          studies_name: details[index]?.enrollment?.studies_name || '-',
        }));

        setCandidates(enriched);
        setIsMockData(Boolean(response.isMock));
      }

      setLoading(false);
    }

    fetchCandidates();

    const watchInterval = setInterval(() => {
      if (!isLoggedIn() && !bypassEnabled) {
        setUserLoggedIn(false);
      }
    }, 30000);

    return () => clearInterval(watchInterval);
  }, []);

  const studiesOptions = useMemo(() => {
    const unique = new Set(candidates.map((item) => item.studies_name).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'pl'));
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((item) => {
      const studiesOk = studiesFilter === 'all' || item.studies_name === studiesFilter;
      const statusInfo = mapStatus(item.status);
      const statusOk = statusFilter === 'all' || statusInfo.value === statusFilter;
      return studiesOk && statusOk;
    });
  }, [candidates, studiesFilter, statusFilter]);

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-candidates-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Kandydaci</div>
        <p className='admin-candidates-subtitle'>
          Lista kandydatów z możliwością filtrowania po kierunku i statusie.
        </p>

        {(isBypassMode || isMockData) && (
          <div className='admin-preview-note admin-candidates-width'>
            Tryb podglądu: lista może korzystać z danych testowych lub fallbacku.
          </div>
        )}

        <section className='bg-panel admin-candidates-panel admin-candidates-width'>
          <div className='admin-candidates-filters'>
            <label>
              <span>Kierunek</span>
              <select value={studiesFilter} onChange={(event) => setStudiesFilter(event.target.value)}>
                <option value='all'>Wszystkie kierunki</option>
                {studiesOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value='all'>Wszystkie statusy</option>
                <option value='accepted'>Zaakceptowany na studia</option>
                <option value='in-progress'>W trakcie</option>
                <option value='rejected'>Wykreślony / Odrzucony</option>
              </select>
            </label>
          </div>

          {error && <div className='error-message'>{error}</div>}
          {loading && <p>Ładowanie kandydatów...</p>}

          {!loading && !error && (
            <table className='styled-table'>
              <thead>
                <tr>
                  <th>Imię i nazwisko</th>
                  <th>Kierunek</th>
                  <th>Status</th>
                  <th>Więcej szczegółów</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((item) => {
                    const status = mapStatus(item.status);
                    return (
                      <tr key={item.id}>
                        <td>{item.student_name || '-'}</td>
                        <td>{item.studies_name || '-'}</td>
                        <td>
                          <span className={status.className}>{status.label}</span>
                        </td>
                        <td>
                          <Link className='admin-details-link' to={`/admin/candidates/${item.id}`}>
                            Więcej szczegółów
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4}>Brak kandydatów dla wybranych filtrów.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}