import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken } from '../../services/authService';
import '../../styles/AdminApplicationDetails.css';

const ENABLE_DEV_AUTH_BYPASS = true;

function paymentBadgeClass(isPaid) {
  return isPaid ? 'badge-paid' : 'badge-unpaid';
}

function docsBadgeClass(hasMissingDocuments) {
  return hasMissingDocuments ? 'badge-missing' : 'badge-ok';
}

function documentBadgeClass(status) {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'ACCEPTED' || normalized === 'VERIFIED') {
    return 'badge-ok';
  }

  if (normalized === 'REJECTED') {
    return 'badge-missing';
  }

  return 'badge-unpaid';
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatAddress(address) {
  if (!address) {
    return '-';
  }

  const firstLine = [address.street, address.house_number]
    .filter(Boolean)
    .join(' ');
  const withFlat = [firstLine, address.flat_number ? `m. ${address.flat_number}` : '']
    .filter(Boolean)
    .join(', ');
  const secondLine = [address.postal_code, address.city].filter(Boolean).join(' ');

  return [withFlat, secondLine, address.country].filter(Boolean).join(', ');
}

function InfoRow({ label, value }) {
  return (
    <div className='admin-details-row'>
      <span className='admin-details-row-label'>{label}</span>
      <span className='admin-details-row-value'>{value || '-'}</span>
    </div>
  );
}

export default function ApplicationReviewDetails() {
  const { id } = useParams();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [isMockData, setIsMockData] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const token = getAccessToken();
    const bypassEnabled = import.meta.env.DEV && ENABLE_DEV_AUTH_BYPASS;
    const canPreview = !!token || bypassEnabled;

    setUserLoggedIn(canPreview);

    if (!canPreview) {
      return;
    }

    async function fetchDetails() {
      setLoading(true);
      setError('');
      setActionMessage('');

      const response = await serverApi.getAdminEnrollmentDetails(token, id);

      if (response.error) {
        setEnrollment(null);
        setError(response.errorMsg || 'Nie udało się pobrać szczegółów zgłoszenia.');
      } else {
        setEnrollment(response.enrollment);
        setDecisionNote(response.enrollment?.status_note || '');
        setIsMockData(Boolean(response.isMock));
      }

      setLoading(false);
    }

    fetchDetails();
  }, [id]);

  const summary = useMemo(() => {
    if (!enrollment) {
      return { documentsCount: 0, acceptedDocuments: 0, feesCount: 0 };
    }

    return {
      documentsCount: enrollment.documents?.length || 0,
      acceptedDocuments: enrollment.documents?.filter(
        (item) => item.status === 'ACCEPTED' || item.status === 'VERIFIED',
      ).length || 0,
      feesCount: enrollment.fees?.length || 0,
    };
  }, [enrollment]);

  async function handleDecision(decision) {
    if (!enrollment) {
      return;
    }

    setSubmittingDecision(true);
    setError('');
    setActionMessage('');

    const token = getAccessToken();
    const response = await serverApi.reviewAdminEnrollment(token, enrollment.id, decision, decisionNote);

    if (response.error) {
      setError(response.errorMsg || 'Nie udało się zapisać decyzji.');
    } else {
      setEnrollment(response.enrollment || enrollment);
      setIsMockData(Boolean(response.isMock));
      setActionMessage(
        decision === 'accept'
          ? 'Zgłoszenie zostało oznaczone jako zaakceptowane.'
          : 'Zgłoszenie zostało oznaczone jako odrzucone.',
      );
    }

    setSubmittingDecision(false);
  }

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-applications-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='admin-details-header'>
          <Link className='admin-back-link' to='/admin/applications'>
            Wroc do listy zgłoszeń
          </Link>
          <div className='page-title admin-details-title'>Szczegóły zgłoszenia</div>
          <p className='admin-applications-subtitle'>
            Pełny podgląd formularza, dokumentów i statusu procesu rekrutacyjnego.
          </p>
        </div>

        {isMockData && !loading && (
          <div className='admin-preview-note admin-details-width'>
            Tryb podglądu: formularz i decyzje korzystają z danych mockowych lub lokalnego fallbacku.
          </div>
        )}

        {error && <div className='error-message admin-details-width'>{error}</div>}
        {loading && <p className='admin-details-width'>Ładowanie szczegółów zgłoszenia...</p>}

        {!loading && enrollment && (
          <>
            <div className='admin-summary-grid admin-details-width'>
              <div className='admin-summary-card'>
                <p className='admin-summary-label'>Kandydat</p>
                <p className='admin-summary-value admin-summary-value-compact'>{enrollment.student_name}</p>
              </div>

              <div className='admin-summary-card'>
                <p className='admin-summary-label'>Kierunek</p>
                <p className='admin-summary-value admin-summary-value-compact'>{enrollment.studies_name || '-'}</p>
              </div>

              <div className='admin-summary-card'>
                <p className='admin-summary-label'>Status</p>
                <p className='admin-summary-value admin-summary-value-compact'>{enrollment.status || '-'}</p>
              </div>
            </div>

            <div className='admin-details-grid admin-details-width'>
              <section className='bg-panel admin-details-section'>
                <h2>Podsumowanie zgłoszenia</h2>
                <InfoRow label='ID zgłoszenia' value={String(enrollment.id)} />
                <InfoRow label='Data wysłania' value={formatDate(enrollment.enrollment_date)} />
                <InfoRow label='Status systemowy' value={enrollment.system_status} />
                <InfoRow label='Edycja' value={enrollment.edition_name} />
                <InfoRow label='Notatka administracyjna' value={enrollment.status_note || 'Brak notatki'} />
              </section>

              <section className='bg-panel admin-details-section'>
                <h2>Stan formalny</h2>
                <InfoRow
                  label='Płatność'
                  value={<span className={paymentBadgeClass(enrollment.is_fully_paid)}>{enrollment.is_fully_paid ? 'Opłacone' : 'Nieopłacone'}</span>}
                />
                <InfoRow
                  label='Dokumenty'
                  value={<span className={docsBadgeClass(enrollment.missing_documents)}>{enrollment.missing_documents ? 'Braki' : 'Komplet'}</span>}
                />
                <InfoRow label='Dokumenty zaakceptowane' value={`${summary.acceptedDocuments} / ${summary.documentsCount}`} />
                <InfoRow label='Pozycje płatności' value={String(summary.feesCount)} />
              </section>
            </div>

            <div className='admin-details-grid admin-details-width'>
              <section className='bg-panel admin-details-section'>
                <h2>Dane osobowe</h2>
                <InfoRow label='Imię' value={enrollment.personal?.first_name} />
                <InfoRow label='Drugie imię' value={enrollment.personal?.second_name || '-'} />
                <InfoRow label='Nazwisko' value={enrollment.personal?.last_name} />
                <InfoRow label='Nazwisko rodowe' value={enrollment.personal?.family_name} />
                <InfoRow label='Tytuł' value={enrollment.personal?.academic_title} />
                <InfoRow label='Data urodzenia' value={formatDate(enrollment.personal?.birth_date)} />
                <InfoRow label='Miejsce urodzenia' value={enrollment.personal?.birth_place} />
                <InfoRow label='PESEL' value={enrollment.personal?.pesel} />
                <InfoRow label='Obywatelstwo' value={enrollment.personal?.citizenship} />
              </section>

              <section className='bg-panel admin-details-section'>
                <h2>Dane kontaktowe</h2>
                <InfoRow label='Email' value={enrollment.contact?.email} />
                <InfoRow label='Telefon' value={enrollment.contact?.phone} />
                <InfoRow label='Adres zamieszkania' value={formatAddress(enrollment.residential_address)} />
                <InfoRow label='Adres korespondencyjny' value={formatAddress(enrollment.registered_address)} />
                <InfoRow
                  label='Kontakt awaryjny'
                  value={[
                    enrollment.emergency_contact?.name,
                    enrollment.emergency_contact?.surname,
                    enrollment.emergency_contact?.relation ? `(${enrollment.emergency_contact.relation})` : '',
                    enrollment.emergency_contact?.phone,
                  ].filter(Boolean).join(' ')}
                />
              </section>
            </div>

            <section className='bg-panel admin-details-section admin-details-width'>
              <h2>Wykształcenie</h2>
              <InfoRow label='Opis' value={enrollment.education?.description} />
              <InfoRow label='Kraj ukończenia' value={enrollment.education?.country} />
            </section>

            <section className='bg-panel admin-details-section admin-details-width'>
              <div className='admin-section-heading-row'>
                <h2>Przesłane dokumenty</h2>
                <span className='admin-details-counter'>{summary.documentsCount} pozycji</span>
              </div>

              {summary.documentsCount === 0 ? (
                <p>Brak dokumentów do wyświetlenia.</p>
              ) : (
                <table className='styled-table'>
                  <thead>
                    <tr>
                      <th>Dokument</th>
                      <th>Wymagany</th>
                      <th>Status</th>
                      <th>Plik</th>
                      <th>Data przesłania</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollment.documents.map((document) => (
                      <tr key={document.id}>
                        <td>{document.title}</td>
                        <td>{document.required ? 'Tak' : 'Nie'}</td>
                        <td>
                          <span className={documentBadgeClass(document.status)}>{document.status}</span>
                        </td>
                        <td>{document.file_name || '-'}</td>
                        <td>{formatDateTime(document.submitted_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className='bg-panel admin-details-section admin-details-width'>
              <div className='admin-section-heading-row'>
                <h2>Opłaty</h2>
                <span className='admin-details-counter'>{summary.feesCount} pozycji</span>
              </div>

              {summary.feesCount === 0 ? (
                <p>Brak danych o płatnościach.</p>
              ) : (
                <table className='styled-table'>
                  <thead>
                    <tr>
                      <th>Tytuł</th>
                      <th>Kwota</th>
                      <th>Termin</th>
                      <th>Data opłacenia</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollment.fees.map((fee) => (
                      <tr key={fee.id}>
                        <td>{fee.title}</td>
                        <td>{fee.amount}</td>
                        <td>{formatDate(fee.due_date)}</td>
                        <td>{formatDate(fee.paid_date)}</td>
                        <td>{fee.status || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className='bg-panel admin-details-section admin-details-width admin-decision-panel'>
              <div className='admin-section-heading-row'>
                <h2>Decyzja administracyjna</h2>
              </div>

              <label className='admin-details-note-label' htmlFor='decision-note'>
                Notatka do decyzji
              </label>
              <textarea
                id='decision-note'
                className='admin-details-textarea'
                value={decisionNote}
                onChange={(event) => setDecisionNote(event.target.value)}
                placeholder='Dodaj uzasadnienie lub notatkę dla zespołu rekrutacyjnego.'
              />

              <div className='admin-decision-actions'>
                <button
                  type='button'
                  className='button-primary admin-action-button'
                  disabled={submittingDecision}
                  onClick={() => handleDecision('accept')}
                >
                  Zaakceptuj zgłoszenie
                </button>
                <button
                  type='button'
                  className='button-danger admin-action-button'
                  disabled={submittingDecision}
                  onClick={() => handleDecision('reject')}
                >
                  Odrzuć zgłoszenie
                </button>
              </div>
            </section>

            {actionMessage && <div className='admin-success-message admin-details-width'>{actionMessage}</div>}
          </>
        )}
      </div>
    </div>
  );
}