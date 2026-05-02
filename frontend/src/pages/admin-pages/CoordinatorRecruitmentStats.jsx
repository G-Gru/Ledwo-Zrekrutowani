import React, { useEffect, useMemo, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import '../../styles/AdminCoordinatorStats.css';

const ENABLE_DEV_AUTH_BYPASS = true;

function formatCurrency(value) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value || 0));
}

export default function CoordinatorRecruitmentStats() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedStudies, setSelectedStudies] = useState('all');

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    const canPreview = !!token || bypassEnabled;

    setUserLoggedIn(canPreview);
    if (!canPreview) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      setLoading(true);
      setError('');

      const listResponse = await serverApi.getAdminEnrollments(token);
      if (listResponse.error) {
        setRows([]);
        setError(listResponse.errorMsg || 'Nie udało się pobrać statystyk rekrutacji.');
        setLoading(false);
        return;
      }

      const enrollments = listResponse.enrollments || [];
      const detailResponses = await Promise.all(
        enrollments.map((row) => serverApi.getAdminEnrollmentDetails(token, row.id)),
      );

      const details = detailResponses
        .filter((item) => !item.error && item.enrollment)
        .map((item) => item.enrollment);

      const byEditionMap = new Map();

      details.forEach((item) => {
        const studiesName = item.studies_name || '-';
        const editionName = item.edition_name || 'Edycja';
        const mapKey = `${studiesName}::${editionName}`;

        if (!byEditionMap.has(mapKey)) {
          byEditionMap.set(mapKey, {
            edition_id: mapKey,
            studies_name: studiesName,
            academic_year: editionName,
            candidates_total: 0,
            paid_entries_count: 0,
            unpaid_entries_count: 0,
            missing_documents_count: 0,
            statuses: {
              candidate: 0,
              student: 0,
              expelled: 0,
            },
            amounts: {
              total_fees: 0,
              paid_fees: 0,
              unpaid_fees: 0,
            },
          });
        }

        const row = byEditionMap.get(mapKey);
        row.candidates_total += 1;

        if (item.is_fully_paid) {
          row.paid_entries_count += 1;
        } else {
          row.unpaid_entries_count += 1;
        }

        if (item.missing_documents) {
          row.missing_documents_count += 1;
        }

        if (item.status === 'STUDENT') {
          row.statuses.student += 1;
        } else if (item.status === 'EXPELLED') {
          row.statuses.expelled += 1;
        } else {
          row.statuses.candidate += 1;
        }

        (item.fees || []).forEach((fee) => {
          const amountNum = Number(String(fee.amount || '').replace(/[^\d,.]/g, '').replace(',', '.')) || 0;
          row.amounts.total_fees += amountNum;
          if (fee.paid_date) {
            row.amounts.paid_fees += amountNum;
          } else {
            row.amounts.unpaid_fees += amountNum;
          }
        });
      });

      setRows(Array.from(byEditionMap.values()));

      setLoading(false);
    }

    fetchStats();
  }, []);

  const studiesOptions = useMemo(() => {
    const all = rows || [];
    const unique = [...new Set(all.map((row) => row.studies_name).filter(Boolean))];
    return unique.sort((a, b) => a.localeCompare(b, 'pl'));
  }, [rows]);

  const visibleEditions = useMemo(() => {
    const all = rows || [];
    if (selectedStudies === 'all') {
      return all;
    }
    return all.filter((row) => row.studies_name === selectedStudies);
  }, [rows, selectedStudies]);

  const summary = useMemo(() => {
    return visibleEditions.reduce(
      (acc, row) => {
        acc.editions += 1;
        acc.candidates += row.candidates_total || 0;
        acc.paid += row.paid_entries_count || 0;
        acc.unpaid += row.unpaid_entries_count || 0;
        acc.missingDocs += row.missing_documents_count || 0;
        acc.statusCandidate += row.statuses?.candidate || 0;
        acc.statusStudent += row.statuses?.student || 0;
        acc.statusExpelled += row.statuses?.expelled || 0;
        acc.totalFees += Number(row.amounts?.total_fees || 0);
        acc.paidFees += Number(row.amounts?.paid_fees || 0);
        acc.unpaidFees += Number(row.amounts?.unpaid_fees || 0);
        return acc;
      },
      {
        editions: 0,
        candidates: 0,
        paid: 0,
        unpaid: 0,
        missingDocs: 0,
        statusCandidate: 0,
        statusStudent: 0,
        statusExpelled: 0,
        totalFees: 0,
        paidFees: 0,
        unpaidFees: 0,
      },
    );
  }, [visibleEditions]);

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-coordinator-stats-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Status rekrutacji</div>
        <p className='admin-stats-subtitle'>
          Statystyki rekrutacji dla przypisanych kierunków i edycji.
        </p>

        <section className='bg-panel admin-stats-panel'>
          <div className='admin-stats-toolbar'>
            <label className='admin-stats-filter'>
              <span>Kierunek</span>
              <select value={selectedStudies} onChange={(event) => setSelectedStudies(event.target.value)}>
                <option value='all'>Wszystkie kierunki</option>
                {studiesOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {error && <div className='error-message admin-stats-width'>{error}</div>}

        {loading ? (
          <p className='admin-stats-width'>Ładowanie statystyk...</p>
        ) : (
          <>
            <div className='admin-stats-grid'>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Edycje</p>
                <p className='admin-stats-value'>{summary.editions}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Kandydaci</p>
                <p className='admin-stats-value'>{summary.candidates}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Opłacone wpisowe</p>
                <p className='admin-stats-value admin-stats-success'>{summary.paid}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Nieopłacone wpisowe</p>
                <p className='admin-stats-value admin-stats-alert'>{summary.unpaid}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Braki dokumentów</p>
                <p className='admin-stats-value admin-stats-alert'>{summary.missingDocs}</p>
              </div>
            </div>

            <div className='admin-stats-grid'>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Status: kandydat</p>
                <p className='admin-stats-value'>{summary.statusCandidate}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Status: student</p>
                <p className='admin-stats-value admin-stats-success'>{summary.statusStudent}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Status: odrzucony</p>
                <p className='admin-stats-value admin-stats-alert'>{summary.statusExpelled}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Wpływy łącznie</p>
                <p className='admin-stats-value'>{formatCurrency(summary.totalFees)}</p>
              </div>
              <div className='admin-stats-card'>
                <p className='admin-stats-label'>Wpłacone kwoty</p>
                <p className='admin-stats-value admin-stats-success'>{formatCurrency(summary.paidFees)}</p>
              </div>
            </div>

            <section className='bg-panel admin-stats-panel'>
              <h3 className='admin-stats-section-title'>Szczegóły według edycji</h3>
              {visibleEditions.length === 0 ? (
                <p>Brak danych dla wybranego filtra.</p>
              ) : (
                <div className='admin-stats-table-wrap'>
                  <table className='styled-table'>
                    <thead>
                      <tr>
                        <th>Kierunek</th>
                        <th>Rok akademicki</th>
                        <th>Kandydaci</th>
                        <th>Opłacone</th>
                        <th>Nieopłacone</th>
                        <th>Braki dokumentów</th>
                        <th>Student</th>
                        <th>Odrzucony</th>
                        <th>Wpłacone kwoty</th>
                        <th>Nieopłacone kwoty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleEditions.map((row) => (
                        <tr key={row.edition_id}>
                          <td>{row.studies_name}</td>
                          <td>{row.academic_year || '-'}</td>
                          <td>{row.candidates_total || 0}</td>
                          <td>{row.paid_entries_count || 0}</td>
                          <td>{row.unpaid_entries_count || 0}</td>
                          <td>{row.missing_documents_count || 0}</td>
                          <td>{row.statuses?.student || 0}</td>
                          <td>{row.statuses?.expelled || 0}</td>
                          <td>{formatCurrency(row.amounts?.paid_fees || 0)}</td>
                          <td>{formatCurrency(row.amounts?.unpaid_fees || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
