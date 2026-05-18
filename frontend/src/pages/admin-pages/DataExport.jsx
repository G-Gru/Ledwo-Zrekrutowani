import React, { useEffect, useMemo, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import '../../styles/AdminDataExport.css';

const ENABLE_DEV_AUTH_BYPASS = true;
const EXPORT_TEMPLATE_MINIMAL = 'minimal';
const EXPORT_TEMPLATE_KEY = 'key';
const EXPORT_TEMPLATE_FULL = 'full';

const EXPORT_TEMPLATES = [
  {
    id: EXPORT_TEMPLATE_MINIMAL,
    label: 'Minimalny',
    description: 'Imie i nazwisko, email, kierunek.',
  },
  {
    id: EXPORT_TEMPLATE_KEY,
    label: 'Wazniejsze dane',
    description: 'Dane kontaktowe i rekrutacyjne potrzebne na co dzien.',
  },
  {
    id: EXPORT_TEMPLATE_FULL,
    label: 'Pelny',
    description: 'Wszystkie dostepne dane kandydata, adresy, dokumenty i oplaty.',
  },
];

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

function mapBooleanLabel(value) {
  return value ? 'TAK' : 'NIE';
}

function mapAddress(address) {
  if (!address || typeof address !== 'object') {
    return '-';
  }

  const parts = [
    address.street,
    address.house_number,
    address.flat_number,
    address.postal_code,
    address.city,
    address.country,
  ]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean);

  if (!parts.length) {
    return '-';
  }

  return parts.join(', ');
}

function mapDocumentsStats(documents = []) {
  const accepted = documents.filter((document) => document.status === 'ACCEPTED').length;
  const rejected = documents.filter((document) => document.status === 'REJECTED').length;
  const pending = documents.length - accepted - rejected;
  return { accepted, rejected, pending };
}

function mapFeesStats(fees = []) {
  const unpaid = fees.filter((fee) => !fee.paid_date).length;
  return {
    total: fees.length,
    unpaid,
  };
}

function mapIndexNumber(details, row) {
  return details?.index_number || row?.index_number || '-';
}

export default function DataExport() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [previewDetailsLoading, setPreviewDetailsLoading] = useState(false);
  const [previewDetailsById, setPreviewDetailsById] = useState(new Map());
  const [rows, setRows] = useState([]);
  const [selectedStudiesId, setSelectedStudiesId] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState(EXPORT_TEMPLATE_MINIMAL);

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

      const response = await serverApi.getAdminUsosExport(token);
      if (response.error) {
        setRows(SAMPLE_EXPORT_ROWS);
        setError('Tryb podglądu: backend niedostępny, wyświetlane są przykładowe dane.');
        setLoading(false);
        return;
      }

      const exportRows = response.rows || [];
      if (!exportRows.length) {
        setRows(SAMPLE_EXPORT_ROWS);
        setError('Tryb podglądu: brak danych z backendu, wyświetlane są przykładowe dane.');
      } else {
        setRows(exportRows);
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

  useEffect(() => {
    let cancelled = false;

    async function fetchPreviewDetails() {
      if (selectedTemplate === EXPORT_TEMPLATE_MINIMAL || !filteredRows.length) {
        setPreviewDetailsById(new Map());
        setPreviewDetailsLoading(false);
        return;
      }

      setPreviewDetailsLoading(true);
      const token = getAccessToken();
      const details = await getDetailsByEnrollmentId(filteredRows, token);

      if (!cancelled) {
        setPreviewDetailsById(details);
        setPreviewDetailsLoading(false);
      }
    }

    fetchPreviewDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedTemplate, filteredRows]);

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

  function buildMinimalTemplateRows(targetRows) {
    const headers = ['Imie i nazwisko', 'Email', 'Kierunek'];
    const body = targetRows.map((row) => [
      mapCsvCell(row.student_name || '-'),
      mapCsvCell(row.email || ''),
      mapCsvCell(row.studies_name || ''),
    ]);

    return { headers, body };
  }

  function buildKeyTemplateRows(targetRows, detailsById) {
    const headers = [
      'ID zgloszenia',
      'Imie i nazwisko',
      'Nr indeksu',
      'Email',
      'Telefon',
      'PESEL',
      'Kierunek',
      'Status',
      'Oplaty kompletne',
      'Dokumenty kompletne',
      'Data zgloszenia',
    ];

    const body = targetRows.map((row) => {
      const details = detailsById.get(row.id);
      return [
        mapCsvCell(row.id),
        mapCsvCell(row.student_name || details?.student_name || '-'),
        mapCsvCell(mapIndexNumber(details, row)),
        mapCsvCell(details?.contact?.email || row.email || ''),
        mapCsvCell(details?.contact?.phone || ''),
        mapCsvCell(details?.personal?.pesel || row.pesel || ''),
        mapCsvCell(row.studies_name || details?.studies_name || ''),
        mapCsvCell(mapExportStatus(details || row)),
        mapCsvCell(mapBooleanLabel(details?.is_fully_paid ?? row.is_fully_paid)),
        mapCsvCell(mapBooleanLabel(!(details?.missing_documents ?? row.missing_documents))),
        mapCsvCell(details?.enrollment_date || row.enrollment_date || ''),
      ];
    });

    return { headers, body };
  }

  function buildFullTemplateRows(targetRows, detailsById) {
    const headers = [
      'ID zgloszenia',
      'Imie i nazwisko',
      'Nr indeksu',
      'Email',
      'Telefon',
      'PESEL',
      'Kierunek',
      'Status',
      'Data zgloszenia',
      'Obywatelstwo',
      'Adres zamieszkania',
      'Adres zameldowania',
      'Nazwisko rodowe',
      'Tytul',
      'Data urodzenia',
      'Miejsce urodzenia',
      'Kontakt awaryjny imie',
      'Kontakt awaryjny nazwisko',
      'Kontakt awaryjny relacja',
      'Kontakt awaryjny telefon',
      'Oplaty kompletne',
      'Liczba oplat',
      'Liczba nieoplaconych oplat',
      'Dokumenty kompletne',
      'Dokumenty zaakceptowane',
      'Dokumenty odrzucone',
      'Dokumenty oczekujace',
    ];

    const body = targetRows.map((row) => {
      const details = detailsById.get(row.id);
      const feeStats = mapFeesStats(details?.fees || []);
      const documentStats = mapDocumentsStats(details?.documents || []);

      return [
        mapCsvCell(row.id),
        mapCsvCell(row.student_name || details?.student_name || '-'),
        mapCsvCell(mapIndexNumber(details, row)),
        mapCsvCell(details?.contact?.email || row.email || ''),
        mapCsvCell(details?.contact?.phone || ''),
        mapCsvCell(details?.personal?.pesel || row.pesel || ''),
        mapCsvCell(row.studies_name || details?.studies_name || ''),
        mapCsvCell(mapExportStatus(details || row)),
        mapCsvCell(details?.enrollment_date || row.enrollment_date || ''),
        mapCsvCell(details?.personal?.citizenship || ''),
        mapCsvCell(mapAddress(details?.residential_address)),
        mapCsvCell(mapAddress(details?.registered_address)),
        mapCsvCell(details?.personal?.family_name || ''),
        mapCsvCell(details?.personal?.academic_title || ''),
        mapCsvCell(details?.personal?.birth_date || ''),
        mapCsvCell(details?.personal?.birth_place || ''),
        mapCsvCell(details?.emergency_contact?.name || ''),
        mapCsvCell(details?.emergency_contact?.surname || ''),
        mapCsvCell(details?.emergency_contact?.relation || ''),
        mapCsvCell(details?.emergency_contact?.phone || ''),
        mapCsvCell(mapBooleanLabel(details?.is_fully_paid ?? row.is_fully_paid)),
        mapCsvCell(feeStats.total),
        mapCsvCell(feeStats.unpaid),
        mapCsvCell(mapBooleanLabel(!(details?.missing_documents ?? row.missing_documents))),
        mapCsvCell(documentStats.accepted),
        mapCsvCell(documentStats.rejected),
        mapCsvCell(documentStats.pending),
      ];
    });

    return { headers, body };
  }

  async function getDetailsByEnrollmentId(targetRows, token) {
    const detailsById = new Map();

    if (!targetRows.length) {
      return detailsById;
    }

    await Promise.all(
      targetRows.map(async (row) => {
        const response = await serverApi.getAdminEnrollmentDetails(token, row.id);
        if (!response.error && response.enrollment) {
          detailsById.set(row.id, response.enrollment);
        }
      }),
    );

    return detailsById;
  }

  async function downloadCsv() {
    if (!filteredRows.length) {
      return;
    }

    setExportError('');
    setIsExporting(true);

    const token = getAccessToken();
    let detailsById = new Map();
    let shouldWarnAboutMissingDetails = false;

    if (selectedTemplate !== EXPORT_TEMPLATE_MINIMAL) {
      detailsById = await getDetailsByEnrollmentId(filteredRows, token);
      shouldWarnAboutMissingDetails = detailsById.size < filteredRows.length;
    }

    let csvDefinition;
    if (selectedTemplate === EXPORT_TEMPLATE_FULL) {
      csvDefinition = buildFullTemplateRows(filteredRows, detailsById);
    } else if (selectedTemplate === EXPORT_TEMPLATE_KEY) {
      csvDefinition = buildKeyTemplateRows(filteredRows, detailsById);
    } else {
      csvDefinition = buildMinimalTemplateRows(filteredRows);
    }

    const { headers, body } = csvDefinition;
    const csv = [headers.join(','), ...body.map((line) => line.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const datePart = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `eksport-danych-${selectedTemplate}-${datePart}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    if (shouldWarnAboutMissingDetails) {
      setExportError('Czesc rekordow zostala wyeksportowana bez pelnych danych, bo nie udalo sie pobrac szczegolow dla wszystkich kandydatow.');
    }

    setIsExporting(false);
  }

  const previewTable = useMemo(() => {
    if (selectedTemplate === EXPORT_TEMPLATE_FULL) {
      const headers = [
        'ID',
        'Imie i nazwisko',
        'Nr indeksu',
        'Email',
        'Telefon',
        'PESEL',
        'Kierunek',
        'Status',
        'Data zgloszenia',
        'Obywatelstwo',
        'Adres zamieszkania',
        'Adres zameldowania',
        'Nazwisko rodowe',
        'Tytul',
        'Data urodzenia',
        'Miejsce urodzenia',
        'Oplaty kompletne',
        'Dokumenty kompletne',
      ];

      const tableRows = filteredRows.map((row) => {
        const details = previewDetailsById.get(row.id);
        return [
          row.id,
          row.student_name || details?.student_name || '-',
          mapIndexNumber(details, row),
          details?.contact?.email || row.email || '-',
          details?.contact?.phone || '-',
          details?.personal?.pesel || row.pesel || '-',
          row.studies_name || details?.studies_name || '-',
          mapExportStatus(details || row),
          details?.enrollment_date || row.enrollment_date || '-',
          details?.personal?.citizenship || '-',
          mapAddress(details?.residential_address),
          mapAddress(details?.registered_address),
          details?.personal?.family_name || '-',
          details?.personal?.academic_title || '-',
          details?.personal?.birth_date || '-',
          details?.personal?.birth_place || '-',
          mapBooleanLabel(details?.is_fully_paid ?? row.is_fully_paid),
          mapBooleanLabel(!(details?.missing_documents ?? row.missing_documents)),
        ];
      });

      return { headers, rows: tableRows };
    }

    if (selectedTemplate === EXPORT_TEMPLATE_KEY) {
      const headers = [
        'ID',
        'Imie i nazwisko',
        'Nr indeksu',
        'Email',
        'Telefon',
        'PESEL',
        'Kierunek',
        'Status',
        'Oplaty kompletne',
        'Dokumenty kompletne',
      ];

      const tableRows = filteredRows.map((row) => {
        const details = previewDetailsById.get(row.id);
        return [
          row.id,
          row.student_name || details?.student_name || '-',
          mapIndexNumber(details, row),
          details?.contact?.email || row.email || '-',
          details?.contact?.phone || '-',
          details?.personal?.pesel || row.pesel || '-',
          row.studies_name || details?.studies_name || '-',
          mapExportStatus(details || row),
          mapBooleanLabel(details?.is_fully_paid ?? row.is_fully_paid),
          mapBooleanLabel(!(details?.missing_documents ?? row.missing_documents)),
        ];
      });

      return { headers, rows: tableRows };
    }

    const headers = ['Imie i nazwisko', 'Email', 'Kierunek'];
    const tableRows = filteredRows.map((row) => [
      row.student_name || '-',
      row.email || '-',
      row.studies_name || '-',
    ]);

    return { headers, rows: tableRows };
  }, [filteredRows, previewDetailsById, selectedTemplate]);

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-export-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Eksport danych kandydatow</div>
        <p className='admin-export-subtitle'>
          Wybierz kierunek i szablon, a nastepnie pobierz CSV z danymi kandydatow.
        </p>

        <section className='bg-panel admin-export-panel'>
          <h3 className='admin-export-section-title'>Parametry eksportu</h3>
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
            <label className='admin-export-field'>
              <span>Szablon danych</span>
              <select
                value={selectedTemplate}
                onChange={(event) => setSelectedTemplate(event.target.value)}
              >
                {EXPORT_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className='admin-export-template-note'>
            {EXPORT_TEMPLATES.find((template) => template.id === selectedTemplate)?.description}
          </p>
        </section>

        <section className='bg-panel admin-export-panel'>
          <h3 className='admin-export-section-title'>Podglad rekordow</h3>
          {error && <div className='error-message'>{error}</div>}
          {exportError && <div className='error-message'>{exportError}</div>}
          {loading ? (
            <p>Ładowanie listy...</p>
          ) : previewDetailsLoading ? (
            <p>Ladowanie szczegolow dla podgladu szablonu...</p>
          ) : (
            <div className='admin-export-table-wrap'>
              <table className='styled-table'>
                <thead>
                  <tr>
                    {previewTable.headers.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewTable.rows.length > 0 ? (
                    previewTable.rows.map((tableRow, rowIndex) => (
                      <tr key={`${selectedTemplate}-${filteredRows[rowIndex]?.id || rowIndex}`}>
                        {tableRow.map((cell, cellIndex) => (
                          <td key={`${selectedTemplate}-${rowIndex}-${cellIndex}`}>{cell}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={previewTable.headers.length}>Brak rekordow dla wybranego kierunku.</td>
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
            <button
              type='button'
              className='button-primary'
              onClick={downloadCsv}
              disabled={!filteredRows.length || loading || isExporting}
            >
              {isExporting ? 'Przygotowywanie CSV...' : 'Pobierz plik CSV'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}