import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import '../../styles/AdminApplicationsReview.css';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import LoginRedirectPage from '../../components/LoginRedirectPage';

const ENABLE_DEV_AUTH_BYPASS = true;

function paymentStatusLabel(isFullyPaid) {
  return isFullyPaid ? 'Opłacone' : 'Nieopłacone';
}

function docsStatusLabel(hasMissingDocuments) {
  return hasMissingDocuments ? 'Braki' : 'Komplet';
}

export default function ApplicationsReview() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [onlyUnpaid, setOnlyUnpaid] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    setIsBypassMode(!token && bypassEnabled);
    setUserLoggedIn(!!token || bypassEnabled);

    if (!token && !bypassEnabled) return;

    async function fetchEnrollments() {
      setLoading(true);
      setError('');

      const response = onlyUnpaid
        ? await serverApi.getAdminUnpaidEnrollments(token)
        : await serverApi.getAdminEnrollments(token);

      if (response.error) {
        setEnrollments([]);
        setIsMockData(false);
        setError(response.errorMsg || 'Wystąpił błąd podczas pobierania zgłoszeń.');
      } else {
        setEnrollments(response.enrollments || []);
        setIsMockData(Boolean(response.isMock));
      }

      setLoading(false);
    }

    fetchEnrollments();

    const watchInterval = setInterval(() => {
      if (!isLoggedIn() && !bypassEnabled) {
        setUserLoggedIn(false);
      }
    }, 30000);

    return () => clearInterval(watchInterval);
  }, [onlyUnpaid, refreshTick]);

  const summary = useMemo(() => {
    const total = enrollments.length;
    const unpaid = enrollments.filter((e) => !e.is_fully_paid).length;
    const missingDocs = enrollments.filter((e) => e.missing_documents).length;
    return { total, unpaid, missingDocs };
  }, [enrollments]);

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-applications-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Przegląd Zgłoszeń</div>
        <p className='admin-applications-subtitle'>
          Podgląd zgłoszeń kandydatów.
        </p>

        <div className='admin-summary-grid'>
          <div className='admin-summary-card'>
            <p className='admin-summary-label'>Liczba kandydatów</p>
            <p className='admin-summary-value'>{summary.total}</p>
          </div>

          <div className='admin-summary-card'>
            <p className='admin-summary-label'>Brak dokumentów</p>
            <p className='admin-summary-value'>
              {summary.missingDocs}
            </p>
          </div>

          <div className='admin-summary-card admin-summary-card-alert'>
            <p className='admin-summary-label'>Nieopłacone</p>
            <p className='admin-summary-value admin-summary-value-alert'>
              {summary.unpaid}
            </p>
          </div>
        </div>

        <div className='bg-panel admin-applications-panel'>
          {(isBypassMode || isMockData) && (
            <div className='admin-preview-note'>
              Tryb podglądu: lista korzysta z danych testowych albo fallbacku, więc możesz sprawdzić nowy widok bez backendu.
            </div>
          )}

          <div className='admin-applications-toolbar'>
            <label className='admin-filter-checkbox'>
              <input
                type='checkbox'
                checked={onlyUnpaid}
                onChange={(e) => setOnlyUnpaid(e.target.checked)}
              />
              Tylko nieopłacone zgłoszenia
            </label>
            <button
              className='button-secondary admin-refresh-button'
              type='button'
              onClick={() => setRefreshTick((prev) => prev + 1)}
            >
              Odśwież
            </button>
          </div>

          {error && <div className='error-message'>{error}</div>}
          {loading && <p>Ładowanie zgłoszeń...</p>}

          {!loading && !error && (
            <>
              {enrollments.length === 0 ? (
                <p>Brak zgłoszeń dla aktualnego filtra.</p>
              ) : (
                <table className='styled-table'>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Kandydat</th>
                      <th>Status</th>
                      <th>Płatność</th>
                      <th>Dokumenty</th>
                      <th>Data zgłoszenia</th>
                      <th>Status systemowy</th>
                      <th>Szczegóły</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.student_name}</td>
                        <td>{item.status || '-'}</td>
                        <td>
                          <span className={!item.is_fully_paid ? 'badge-unpaid' : 'badge-paid'}>
                            {paymentStatusLabel(item.is_fully_paid)}
                          </span>
                        </td>
                        <td>
                          <span className={item.missing_documents ? 'badge-missing' : 'badge-ok'}>
                            {docsStatusLabel(item.missing_documents)}
                          </span>
                        </td>
                        <td>{item.enrollment_date || '-'}</td>
                        <td>{item.system_status || '-'}</td>
                        <td>
                          <Link className='admin-details-link' to={`/admin/applications/${item.id}`}>
                            Zobacz szczegóły
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
