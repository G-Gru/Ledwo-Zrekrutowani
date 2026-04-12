import React, { useEffect, useMemo, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import '../../styles/AdminApplicationsReview.css';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import LoginRedirectPage from '../../components/LoginRedirectPage';

const ENABLE_DEV_AUTH_BYPASS = true;

const MOCK_ENROLLMENTS = [
  {
    id: 101,
    student_name: 'Jan Kowalski',
    status: 'W_TRAKCIE',
    enrollment_date: '2026-03-20',
    is_fully_paid: false,
    missing_documents: true,
    system_status: 'NIESPELNIONE WYMOGI (Brak Oplat/Dokumentow)',
  },
  {
    id: 102,
    student_name: 'Anna Nowak',
    status: 'W_TRAKCIE',
    enrollment_date: '2026-03-22',
    is_fully_paid: true,
    missing_documents: false,
    system_status: 'KOMPLETNE - GOTOWE DO DECYZJI',
  },
  {
    id: 103,
    student_name: 'Piotr Zielinski',
    status: 'W_TRAKCIE',
    enrollment_date: '2026-03-24',
    is_fully_paid: false,
    missing_documents: false,
    system_status: 'NIESPELNIONE WYMOGI (Brak Oplat/Dokumentow)',
  },
];

function paymentStatusLabel(isFullyPaid) {
  return isFullyPaid ? 'Opłacone' : 'Nieopłacone';
}

function docsStatusLabel(hasMissingDocuments) {
  return hasMissingDocuments ? 'Braki' : 'Komplet';
}

export default function ApplicationsReview() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
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

    if (!token && bypassEnabled) {
      const mocked = onlyUnpaid
        ? MOCK_ENROLLMENTS.filter((item) => !item.is_fully_paid)
        : MOCK_ENROLLMENTS;
      setEnrollments(mocked);
      setLoading(false);
      setError('');
      return;
    }

    if (!token) return;

    async function fetchEnrollments() {
      setLoading(true);
      setError('');

      const response = onlyUnpaid
        ? await serverApi.getAdminUnpaidEnrollments(token)
        : await serverApi.getAdminEnrollments(token);

      if (response.error) {
        setEnrollments([]);
        setError(response.errorMsg || 'Wystąpił błąd podczas pobierania zgłoszeń.');
      } else {
        setEnrollments(response.enrollments || []);
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
          {isBypassMode && (
            <div className='admin-preview-note'>
              Tryb podglądu: strona działa bez logowania i pokazuje dane testowe.
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
