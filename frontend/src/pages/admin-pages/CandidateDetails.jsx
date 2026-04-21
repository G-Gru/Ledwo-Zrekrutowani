import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import { formatDateInWarsaw, formatDateTimeInWarsaw } from '../../utils/dateTime';
import '../../styles/AdminCandidates.css';

const ENABLE_DEV_AUTH_BYPASS = true;
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function candidateStatusInfo(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (['STUDENT', 'ACCEPTED', 'ZAAKCEPTOWANE'].includes(normalized)) {
    return { label: 'Zaakceptowany na studia', className: 'candidate-status accepted' };
  }
  if (['EXPELLED', 'REJECTED', 'ODRZUCONY', 'ODRZUCONE'].includes(normalized)) {
    return { label: 'Wykreślony / Odrzucony', className: 'candidate-status rejected' };
  }
  return { label: 'W trakcie', className: 'candidate-status in-progress' };
}

function documentStatusClass(status) {
  const normalized = String(status || '').trim().toUpperCase();
  if (['ACCEPTED', 'VERIFIED'].includes(normalized)) {
    return 'doc-status accepted';
  }
  if (normalized === 'REJECTED') {
    return 'doc-status rejected';
  }
  return 'doc-status in-progress';
}

function buildDocumentUrl(documentId) {
  return `${API_BASE_URL}/api/enrollments/files/${documentId}/`;
}

export default function CandidateDetails() {
  const { id } = useParams();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [documentActionLoading, setDocumentActionLoading] = useState(null);
  const [documentActionError, setDocumentActionError] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    const canPreview = !!token || bypassEnabled;

    setUserLoggedIn(canPreview);
    if (!canPreview) {
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      setLoading(true);
      setError('');

      const response = await serverApi.getAdminEnrollmentDetails(token, id);
      if (response.error) {
        setEnrollment(null);
        setError(response.errorMsg || 'Nie udało się pobrać szczegółów kandydata.');
      } else {
        setEnrollment(response.enrollment);
      }

      setLoading(false);
    }

    fetchDetails();
  }, [id]);

  const statusInfo = useMemo(
    () => candidateStatusInfo(enrollment?.status),
    [enrollment?.status]
  );

  const handleDocumentAction = async (documentId, action) => {
    const token = getAccessToken();
    if (!token) return;

    setDocumentActionLoading(`${documentId}-${action}`);
    setDocumentActionError('');

    let result;
    if (action === 'accept') {
      result = await serverApi.acceptDocument(token, id, documentId);
    } else if (action === 'reject') {
      result = await serverApi.rejectDocument(token, id, documentId);
    }

    setDocumentActionLoading(null);

    if (result.error) {
      setDocumentActionError(result.errorMsg);
    } else {
      // Refresh enrollment details
      const response = await serverApi.getAdminEnrollmentDetails(token, id);
      if (!response.error) {
        setEnrollment(response.enrollment);
      }
    }
  };

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-candidates-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='admin-candidates-header'>
          <Link className='admin-back-link' to='/admin/candidates'>
            Wroc do listy kandydatów
          </Link>
          <h1 className='admin-candidate-title'>
            Szczegóły kandydata: {enrollment?.student_name || '-'}
          </h1>
          {!loading && enrollment && (
            <div className='admin-candidate-meta'>
              <span className={statusInfo.className}>{statusInfo.label}</span>
              <span>ID kandydata: {enrollment.id}</span>
            </div>
          )}
        </div>

        {error && <div className='error-message admin-candidates-width'>{error}</div>}
        {documentActionError && <div className='error-message admin-candidates-width'>{documentActionError}</div>}
        {loading && <p className='admin-candidates-width'>Ładowanie danych kandydata...</p>}

        {!loading && enrollment && (
          <>
            <div className='admin-candidate-top-grid admin-candidates-width'>
              <section className='bg-panel admin-candidate-card'>
                <h2>Dane osobowe</h2>
                <div className='admin-candidate-info-grid'>
                  <div>
                    <span className='label'>Imię</span>
                    <p>{enrollment.personal?.first_name || enrollment.first_name || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Nazwisko</span>
                    <p>{enrollment.personal?.last_name || enrollment.last_name || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Data urodzenia</span>
                    <p>{formatDateInWarsaw(enrollment.personal?.birth_date)}</p>
                  </div>
                  <div>
                    <span className='label'>PESEL</span>
                    <p>{enrollment.personal?.pesel || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Nr indeksu</span>
                    <p>-</p>
                  </div>
                  <div>
                    <span className='label'>Telefon</span>
                    <p>{enrollment.contact?.phone || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>E-mail</span>
                    <p>{enrollment.contact?.email || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Kierunek</span>
                    <p>{enrollment.studies_name || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Obywatelstwo</span>
                    <p>{enrollment.personal?.citizenship || '-'}</p>
                  </div>
                  <div>
                    <span className='label'>Data zgłoszenia</span>
                    <p>{formatDateTimeInWarsaw(enrollment.enrollment_date)}</p>
                  </div>
                </div>
              </section>

              <section className='bg-panel admin-candidate-actions-panel'>
                <h2>Panel akcji</h2>
                <Link className='button-primary admin-action-link' to={`/admin/applications/${enrollment.id}`}>
                  Otwórz formularz kandydata
                </Link>
                <button type='button' className='button-secondary' disabled>
                  Dodaj komentarz
                </button>
                <button type='button' className='button-secondary' disabled>
                  Wyślij powiadomienie o brakach
                </button>
                <button type='button' className='button-danger' disabled>
                  Wykreśl z listy
                </button>
              </section>
            </div>

            <section className='bg-panel admin-candidate-docs admin-candidates-width'>
              <div className='admin-candidate-docs-header'>
                <h2>Dokumenty</h2>
                <span>{enrollment.documents?.length || 0} dokumentów</span>
              </div>

              {!enrollment.documents?.length ? (
                <p>Brak dokumentów do wyświetlenia.</p>
              ) : (
                <table className='styled-table'>
                  <thead>
                    <tr>
                      <th>Nazwa dokumentu</th>
                      <th>Status</th>
                      <th>Data przesłania</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollment.documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <div className='doc-name-cell'>
                            <strong>{document.title || '-'}</strong>
                            <small>{document.file_name || '-'}</small>
                          </div>
                        </td>
                        <td>
                          <span className={documentStatusClass(document.status)}>{document.status || '-'}</span>
                        </td>
                        <td>{formatDateTimeInWarsaw(document.submitted_date)}</td>
                        <td>
                          <div className='doc-actions'>
                            <a
                              className='admin-details-link'
                              href={buildDocumentUrl(document.id)}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              Podgląd
                            </a>
                            <a
                              className='admin-details-link'
                              href={buildDocumentUrl(document.id)}
                              download
                            >
                              Pobierz
                            </a>
                            <button
                              type='button'
                              className='button-secondary'
                              onClick={() => handleDocumentAction(document.id, 'accept')}
                              disabled={documentActionLoading && documentActionLoading.startsWith(`${document.id}-`)}
                            >
                              {documentActionLoading === `${document.id}-accept` ? 'Akceptuję...' : 'Akceptuj'}
                            </button>
                            <button
                              type='button'
                              className='button-danger'
                              onClick={() => handleDocumentAction(document.id, 'reject')}
                              disabled={documentActionLoading && documentActionLoading.startsWith(`${document.id}-`)}
                            >
                              {documentActionLoading === `${document.id}-reject` ? 'Odrzucam...' : 'Odrzuć'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
