import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import '../../styles/AdminApplicationsReview.css';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, isLoggedIn } from '../../services/authService';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { formatDateTimeInWarsaw } from '../../utils/dateTime';

const ENABLE_DEV_AUTH_BYPASS = true;

function paymentStatusLabel(isFullyPaid) {
  return isFullyPaid ? 'Opłacone' : 'Nieopłacone';
}

function docsStatusLabel(hasMissingDocuments) {
  return hasMissingDocuments ? 'Braki' : 'Komplet';
}

function normalizeEnrollmentStatus(statusVal) {
  const normalized = String(statusVal || '').trim().toUpperCase();

  const acceptedStatuses = ['STUDENT', 'ACCEPTED', 'ACCEPT', 'ZAAKCEPTOWANE', 'ZAAKCEPTOWANY'];
  const rejectedStatuses = ['EXPELLED', 'REJECTED', 'REJECT', 'ODRZUCONE', 'ODRZUCONY'];

  if (acceptedStatuses.includes(normalized)) {
    return 'ACCEPTED';
  }

  if (rejectedStatuses.includes(normalized)) {
    return 'REJECTED';
  }

  return 'IN_PROGRESS';
}

function enrollmentStatusLabel(statusVal) {
  const normalized = normalizeEnrollmentStatus(statusVal);
  if (normalized === 'ACCEPTED') {
    return 'Zaakceptowane';
  }
  if (normalized === 'REJECTED') {
    return 'Odrzucone';
  }
  return 'W trakcie';
}

function enrollmentStatusBadge(statusVal) {
  switch (normalizeEnrollmentStatus(statusVal)) {
    case 'ACCEPTED':
      return <span className='badge-status badge-status-accepted'>Zaakceptowane</span>;
    case 'REJECTED':
      return <span className='badge-status badge-status-rejected'>Odrzucone</span>;
    default:
      return <span className='badge-status badge-status-in-progress'>W trakcie</span>;
  }
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
  const [reminderMsg, setReminderMsg] = useState('');
  const [reminderLoading, setReminderLoading] = useState(false);

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
    const inProgress = enrollments.filter(
      (e) => normalizeEnrollmentStatus(e.status) === 'IN_PROGRESS'
    ).length;
    return { total, unpaid, missingDocs, inProgress };
  }, [enrollments]);

  async function handleSendReminders() {
    setReminderLoading(true);
    setReminderMsg('');
    const token = getAccessToken();
    const unpaidEnrollments = enrollments.filter((e) => !e.is_fully_paid);

    if (unpaidEnrollments.length === 0) {
      setReminderMsg('Brak nieopłaconych zgłoszeń.');
      setReminderLoading(false);
      return;
    }

    const results = await Promise.all(
      unpaidEnrollments.map((enrollment) =>
        serverApi.sendPaymentReminder(token, enrollment.id)
      )
    );

    const successCount = results.filter((result) => !result.error).length;
    const failedCount = results.length - successCount;

    if (failedCount === 0) {
      setReminderMsg(`Wysłano ${successCount} przypomnień o płatności.`);
    } else if (successCount > 0) {
      setReminderMsg(`Wysłano ${successCount} przypomnień, ${failedCount} nie udało się wysłać.`);
    } else {
      setReminderMsg('Nie udało się wysłać przypomnień.');
    }

    setReminderLoading(false);
  }

  function handleExportCsv() {
    if (!enrollments.length) return;
    const headers = ['ID', 'Kandydat', 'Status', 'Płatność', 'Dokumenty', 'Data zgłoszenia'];
    const rows = enrollments.map((e) => [
      e.id,
      `"${(e.student_name || '').replace(/"/g, '""')}"`,
      enrollmentStatusLabel(e.status),
      e.is_fully_paid ? 'Opłacone' : 'Nieopłacone',
      e.missing_documents ? 'Braki' : 'Komplet',
      formatDateTimeInWarsaw(e.enrollment_date, ''),
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kandydaci.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

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

          <div className='admin-summary-card admin-summary-card-warning'>
            <p className='admin-summary-label'>Wymaga akcji</p>
            <p className='admin-summary-value admin-summary-value-warning'>
              {summary.inProgress}
            </p>
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

          <div className='admin-summary-actions'>
            <button
              className='button-primary admin-action-button'
              type='button'
              onClick={handleSendReminders}
              disabled={reminderLoading}
            >
              {reminderLoading ? 'Wysyłanie...' : 'Wyślij przypomnienie o płatności'}
            </button>
            <button
              className='button-primary admin-action-button'
              type='button'
              onClick={handleExportCsv}
            >
              Eksportuj listę kandydatów
            </button>
            {reminderMsg && <p className='admin-reminder-msg'>{reminderMsg}</p>}
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
                      <th>Szczegóły</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.student_name}</td>
                        <td>{enrollmentStatusBadge(item.status)}</td>
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
                        <td>{formatDateTimeInWarsaw(item.enrollment_date)}</td>
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
