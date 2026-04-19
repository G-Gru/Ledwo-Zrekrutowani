import React, { useEffect, useMemo, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import '../../styles/AdminDataExport.css';

const ENABLE_DEV_AUTH_BYPASS = true;
const SAMPLE_EXPORT_ROWS = [
  {
    id: 101,
    student_name: 'Jan Kowalski',
    studies_name: 'Informatyka Stosowana',
    status: 'STUDENT',
    is_fully_paid: true,
    missing_documents: false,
    personal: { pesel: '90090900912' },
  },
  {
    id: 102,
    student_name: 'Piotr Nowak',
    studies_name: 'Informatyka Stosowana',
    status: 'CANDIDATE',
    is_fully_paid: true,
    missing_documents: false,
    personal: { pesel: '90090900913' },
  },
  {
    id: 103,
    student_name: 'Zofia Kaczmarek',
    studies_name: 'Informatyka Stosowana',
    status: 'CANDIDATE',
    is_fully_paid: true,
    missing_documents: true,
    personal: { pesel: '90090900914' },
  },
];

function mapCsvCell(value) {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
}

export default function DataExport() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedStudiesId, setSelectedStudiesId] = useState('all');

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    const canPreview = !!token || bypassEnabled;

    setUserLoggedIn(canPreview);
    if (!canPreview) {
      setLoading(false);
      return;
    }

    async function fetchExportRows() {
      setLoading(true);
      setError('');

      const listResponse = await serverApi.getAdminEnrollments(token);
      if (listResponse.error) {
        setRows(SAMPLE_EXPORT_ROWS);
        setError('Tryb podglądu: backend niedostępny, wyświetlane są przykładowe dane.');
        setLoading(false);
        return;
      }

      const summaryRows = listResponse.enrollments || [];
      const detailResponses = await Promise.all(
        summaryRows.map((row) => serverApi.getAdminEnrollmentDetails(token, row.id))
      );

      const detailedRows = detailResponses
        .filter((response) => !response.error && response.enrollment)
        .map((response) => response.enrollment);

      if (!detailedRows.length) {
        setRows(SAMPLE_EXPORT_ROWS);
        setError('Tryb podglądu: brak danych z backendu, wyświetlane są przykładowe dane.');
      } else {
        setRows(detailedRows);
      }

      setLoading(false);
    }

    fetchExportRows();
  }, []);

  const studiesOptions = useMemo(() => {
    const unique = new Map();
    rows.forEach((row) => {
      const studiesName = row.studies_name;
      if (studiesName) {
        unique.set(studiesName, studiesName);
      }
    });

    return Array.from(unique.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'pl'));
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selectedStudiesId === 'all') {
      return rows;
    }
    return rows.filter((row) => row.studies_name === selectedStudiesId);
  }, [rows, selectedStudiesId]);

  function mapExportStatus(row) {
    if (row.missing_documents) {
      return 'Brak dokumentów';
    }
    if (!row.is_fully_paid) {
      return 'Brak opłaty';
    }
    if (row.status === 'EXPELLED') {
      return 'Odrzucony';
    }
    if (row.status === 'STUDENT') {
      return 'Gotowy';
    }
    return 'W trakcie';
  }

  function downloadCsv() {
    if (!filteredRows.length) {
      return;
    }

    const headers = ['Imię i nazwisko', 'PESEL', 'Kierunek', 'Nr indeksu', 'Status'];
    const body = filteredRows.map((row) => [
      mapCsvCell(row.student_name || '-'),
      mapCsvCell(row.personal?.pesel || ''),
      mapCsvCell(row.studies_name || ''),
      mapCsvCell('-'),
      mapCsvCell(mapExportStatus(row)),
    ]);

    const csv = [headers.join(','), ...body.map((line) => line.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'usos-eksport.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-export-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Eksport danych do USOS</div>
        <p className='admin-export-subtitle'>
          Przekaż dane przyjętych studentów do COK w celu nadania numerów indeksów.
        </p>

        <section className='bg-panel admin-export-panel'>
          <h3 className='admin-export-section-title'>Wybór kierunku</h3>
          <div className='admin-export-filter-grid'>
            <label className='admin-export-field'>
              <span>Kierunek studiów</span>
              <select
                value={selectedStudiesId}
                onChange={(event) => setSelectedStudiesId(event.target.value)}
              >
                <option value='all'>Wszystkie kierunki</option>
                {studiesOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className='bg-panel admin-export-panel'>
          <h3 className='admin-export-section-title'>Lista do eksportu</h3>
          {error && <div className='error-message'>{error}</div>}
          {loading ? (
            <p>Ładowanie listy...</p>
          ) : (
            <div className='admin-export-table-wrap'>
              <table className='styled-table'>
                <thead>
                  <tr>
                    <th>Imię i nazwisko</th>
                    <th>PESEL</th>
                    <th>Kierunek</th>
                    <th>Nr indeksu</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length > 0 ? (
                    filteredRows.map((row) => (
                      <tr key={row.id}>
                        <td>{row.student_name || '-'}</td>
                        <td>{row.personal?.pesel || '-'}</td>
                        <td>{row.studies_name || '-'}</td>
                        <td>-</td>
                        <td>{mapExportStatus(row)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5}>Brak rekordów dla wybranego kierunku.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className='bg-panel admin-export-panel'>
          <h3 className='admin-export-section-title'>Akcje eksportu</h3>
          <div className='admin-export-actions'>
            <button type='button' className='button-primary' onClick={downloadCsv} disabled={!filteredRows.length || loading}>
              Pobierz plik lokalnie
            </button>
            <button type='button' className='button-secondary' disabled>
              Przekaż do COK
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}