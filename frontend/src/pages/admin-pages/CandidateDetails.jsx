import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, getUser } from '../../services/authService';
import { formatDateInWarsaw, formatDateTimeInWarsaw } from '../../utils/dateTime';
import '../../styles/AdminCandidates.css';
import '../../styles/AdminNotifications.css';

const ENABLE_DEV_AUTH_BYPASS = true;
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const EMAIL_TEMPLATES = {
  missing_documents: {
    label: 'Brakujące dokumenty',
    subject: 'Przypomnienie: Brakujące dokumenty',
    body: 'Przypominamy, że do Twojej rekrutacji brakuje wymaganych dokumentów. Prosimy o ich dostarczenie jak najszybciej.'
  },
  missing_payment: {
    label: 'Brakująca płatność',
    subject: 'Przypomnienie: Brakująca płatność',
    body: 'Przypominamy o nieopłaconej opłacie rekrutacyjnej. Prosimy o jej uregulowanie w możliwie najkrótszym terminie.'
  },
  course_start: {
    label: 'Informacja o rozpoczęciu kierunku',
    subject: 'Zapraszamy na początek kierunku',
    body: 'Informujemy, że studia na kierunku {{studies_name}} rozpoczynają się {{start_date}}. Szczegóły organizacyjne znajdują się na portalu.'
  },
  no_start: {
    label: 'Brak startu kierunku',
    subject: 'Informacja o rezygnacji z kierunku',
    body: 'Informujemy, że kierunek {{studies_name}} nie zostanie uruchomiony w tej edycji. Przepraszamy za niedogodności.'
  },
  custom: {
    label: 'Wiadomość niestandardowa',
    subject: '',
    body: ''
  }
};

const AVAILABLE_VARIABLES = [
  { key: '{{user_name}}', label: 'Imię i nazwisko użytkownika' },
  { key: '{{user_email}}', label: 'Email użytkownika' },
  { key: '{{studies_name}}', label: 'Nazwa kierunku' },
  { key: '{{start_date}}', label: 'Data rozpoczęcia' }
];

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


const handleDownload = async (fileId) => {
  await serverApi.downloadFile(fileId, getAccessToken());
};

export default function CandidateDetails() {
  const { id } = useParams();
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollment, setEnrollment] = useState(null);
  const [documentActionLoading, setDocumentActionLoading] = useState(null);
  const [documentActionError, setDocumentActionError] = useState('');
  const [showMailModal, setShowMailModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('missing_documents');
  const [emailSubject, setEmailSubject] = useState(EMAIL_TEMPLATES.missing_documents.subject);
  const [emailBody, setEmailBody] = useState(EMAIL_TEMPLATES.missing_documents.body);
  const [useSenderName, setUseSenderName] = useState(false);
  const [sendingMail, setSendingMail] = useState(false);

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

  const hasEmail = Boolean(enrollment?.contact?.email);

  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = EMAIL_TEMPLATES[templateKey];
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  const preprocessEmailBody = (body, userData) => {
    return body
      .replace(/{{user_name}}/g, userData.student_name || '')
      .replace(/{{user_email}}/g, userData.email || '')
      .replace(/{{studies_name}}/g, userData.studies_name || '')
      .replace(/{{start_date}}/g, '');
  };

  const hasTemplateVariables = (text) => {
    return /{{.*?}}/g.test(text);
  };

  const buildMailPreview = (bodyText, userData) => {
    const resolvedBody = preprocessEmailBody(bodyText, userData);
    const recipient = userData?.student_name || '';
    const user = getUser();
    const senderName = useSenderName
      ? [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim() || 'Nadawca'
      : 'Zespół Ledwo Zrekrutowani';

    return `Dzień dobry ${recipient},\n\n${resolvedBody}\n\nPozdrawiam,\n${senderName}`;
  };

  const handleSendSingleNotification = async () => {
    if (!hasEmail) {
      alert('Brak adresu email dla tego kandydata.');
      return;
    }

    if (!emailSubject.trim()) {
      alert('Podaj temat wiadomości');
      return;
    }

    if (!emailBody.trim()) {
      alert('Podaj treść wiadomości');
      return;
    }

    const targetUser = {
      email: enrollment.contact.email,
      student_name: enrollment.student_name || '',
      studies_name: enrollment.studies_name || ''
    };

    const finalBody = hasTemplateVariables(emailBody)
      ? preprocessEmailBody(emailBody, targetUser)
      : emailBody;

    setSendingMail(true);
    try {
      const response = await serverApi.sendNotification({
        emails: [targetUser.email],
        notification_subject: emailSubject,
        notification_body: finalBody,
        use_own_name_as_sender: useSenderName
      });

      if (response.error) {
        throw new Error(response.errorMsg || 'Błąd podczas wysyłania wiadomości');
      }

      const failedEmails = Array.isArray(response.data?.failed_emails)
        ? response.data.failed_emails
        : [];
      const sentCount = Number(response.data?.sent_count || 0);

      if (failedEmails.includes(targetUser.email) || sentCount < 1) {
        throw new Error('Backend zgłosił błąd dostarczenia wiadomości dla tego użytkownika.');
      }

      alert('Wiadomość została wysłana pomyślnie.');
      setShowMailModal(false);
    } catch (sendError) {
      alert(`Błąd podczas wysyłania wiadomości: ${sendError.message}`);
    } finally {
      setSendingMail(false);
    }
  };

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
                <button
                  type='button'
                  className='button-secondary'
                  onClick={() => setShowMailModal(true)}
                  disabled={!hasEmail}
                  title={!hasEmail ? 'Brak adresu email dla tego kandydata' : ''}
                >
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
                    {enrollment.documents.map((document) => {
                      return <tr key={document.id}>
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
                            <button
                                type="button"
                                className='btn-ghost-icon'
                                onClick={() => handleDownload(document.id)}
                            >
                              Pobierz
                            </button>

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
                    })}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>

      {showMailModal && (
        <div className='modal-overlay' onClick={() => setShowMailModal(false)}>
          <div className='modal-content' onClick={(e) => e.stopPropagation()}>
            <div className='modal-header'>
              <h2>Komponowanie wiadomości</h2>
              <button className='modal-close' onClick={() => setShowMailModal(false)}>✕</button>
            </div>

            <div className='modal-body'>
              <div className='form-group'>
                <label>Szablon wiadomości:</label>
                <select value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                  {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>{template.label}</option>
                  ))}
                </select>
              </div>

              <div className='form-group'>
                <label>Temat:</label>
                <input
                  type='text'
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder='Wprowadź temat wiadomości'
                />
              </div>

              <div className='form-group'>
                <label>Treść wiadomości:</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder='Wprowadź treść wiadomości'
                  rows='8'
                />
              </div>

              <div className='variables-hint'>
                <strong>Dostępne zmienne szablonu:</strong>
                <div className='variables-list'>
                  {AVAILABLE_VARIABLES.map(variable => (
                    <code key={variable.key} onClick={() => setEmailBody(emailBody + ' ' + variable.key)}>
                      {variable.key} - {variable.label}
                    </code>
                  ))}
                </div>
              </div>

              <div className='form-group checkbox-group'>
                <label>
                  <input
                    type='checkbox'
                    checked={useSenderName}
                    onChange={(e) => setUseSenderName(e.target.checked)}
                  />
                  Użyj mojego imienia i nazwiska w podpisie
                </label>
              </div>

              <div className='preview-section'>
                <strong>Podgląd wiadomości:</strong>
                <div className='preview-box'>
                  <p><strong>Temat:</strong> {emailSubject}</p>
                  <p><strong>Treść:</strong></p>
                  <pre>
                    {buildMailPreview(
                      emailBody,
                      {
                        student_name: enrollment?.student_name || '',
                        email: enrollment?.contact?.email || '',
                        studies_name: enrollment?.studies_name || ''
                      }
                    )}
                  </pre>
                  {hasTemplateVariables(emailBody) && (
                    <div className='preview-note'>
                      Zmienne szablonu zostaną zastąpione danymi aktualnego kandydata przy wysyłaniu.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='modal-footer'>
              <button
                className='btn-cancel'
                onClick={() => setShowMailModal(false)}
                disabled={sendingMail}
              >
                Anuluj
              </button>
              <button
                className='btn-send'
                onClick={handleSendSingleNotification}
                disabled={sendingMail || !hasUserId}
              >
                {sendingMail ? 'Wysyłanie...' : 'Wyślij wiadomość'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
