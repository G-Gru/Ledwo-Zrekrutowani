import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import LoginRedirectPage from '../../components/LoginRedirectPage';
import { serverApi } from '../../services/serverApi';
import { getAccessToken, getUser } from '../../services/authService';
import '../../styles/AdminNotifications.css';

// Email templates
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

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Wszyscy' },
  { value: 'student', label: 'Student' },
  { value: 'candidate', label: 'Candidate' },
  { value: 'expelled', label: 'Expelled' }
];

export default function AdminNotifications() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterByEdition, setFilterByEdition] = useState('');
  const [filterByStatus, setFilterByStatus] = useState('');
  const [filterMissingDocs, setFilterMissingDocs] = useState(false);
  const [filterMissingPayment, setFilterMissingPayment] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [allSelected, setAllSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('missing_documents');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [useSenderName, setUseSenderName] = useState(false);
  const [sending, setSending] = useState(false);
  const [editions, setEditions] = useState([]);

  // Load enrollments and filter data
  useEffect(() => {
    const token = getAccessToken();
    setUserLoggedIn(Boolean(token));
    if (!token) {
      setLoading(false);
      return;
    }

    loadEnrollments();
  }, [filterMissingPayment]);

  useEffect(() => {
    const template = EMAIL_TEMPLATES[selectedTemplate];
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const token = getAccessToken();
      const [enrollmentsResponse, exportResponse] = await Promise.all([
        serverApi.getAdminEnrollments(token, {
          unpaidOnly: filterMissingPayment
        }),
        serverApi.getAdminUsosExport(token)
      ]);

      const exportRows = exportResponse.error ? [] : (exportResponse.rows || []);
      const emailByEnrollmentId = new Map(exportRows.map((row) => [row.id, row.email || '']));

      if (enrollmentsResponse.error) {
        console.error('Error loading enrollments:', enrollmentsResponse.errorMsg);
        setEnrollments([]);
        return;
      }

      // Response structure: { enrollments: [...], error: false, ... }
      const enrollmentList = (enrollmentsResponse.enrollments || []).map((row) => ({
        ...row,
        email: row.email || emailByEnrollmentId.get(row.id) || ''
      }));
      setEnrollments(enrollmentList);
      
      // Extract unique editions for filter dropdown
      const editionSet = new Set();
      enrollmentList.forEach(e => {
        if (e.studies_name) editionSet.add(e.studies_name);
      });
      setEditions(Array.from(editionSet).sort());
    } catch (error) {
      console.error('Error loading enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter enrollments based on selected filters
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(enrollment => {
      if (filterByEdition && enrollment.studies_name !== filterByEdition) {
        return false;
      }
      if (filterByStatus && String(enrollment.status || '').toLowerCase() !== filterByStatus) {
        return false;
      }
      if (filterMissingDocs && !enrollment.missing_documents) {
        return false;
      }
      if (filterMissingPayment && enrollment.is_fully_paid) {
        return false;
      }
      return true;
    });
  }, [enrollments, filterByEdition, filterByStatus, filterMissingDocs, filterMissingPayment]);

  useEffect(() => {
    const visibleIds = new Set(filteredEnrollments.map(e => e.id));
    setSelectedUserIds((prevSelected) => {
      const nextSelected = new Set([...prevSelected].filter((id) => visibleIds.has(id)));
      if (nextSelected.size === prevSelected.size) {
        return prevSelected;
      }
      return nextSelected;
    });
  }, [filteredEnrollments]);

  useEffect(() => {
    if (filteredEnrollments.length === 0) {
      setAllSelected(false);
      return;
    }
    const areAllVisibleSelected = filteredEnrollments.every((e) => selectedUserIds.has(e.id));
    setAllSelected(areAllVisibleSelected);
  }, [filteredEnrollments, selectedUserIds]);

  // Handle select all/deselect all
  const handleSelectAll = useCallback(() => {
    setSelectedUserIds((prevSelected) => {
      const nextSelected = new Set(prevSelected);
      if (allSelected) {
        filteredEnrollments.forEach((e) => nextSelected.delete(e.id));
      } else {
        filteredEnrollments.forEach((e) => nextSelected.add(e.id));
      }
      return nextSelected;
    });
  }, [allSelected, filteredEnrollments]);

  // Handle individual checkbox
  const handleSelectUser = useCallback((userId) => {
    setSelectedUserIds((prevSelected) => {
      const nextSelected = new Set(prevSelected);
      if (nextSelected.has(userId)) {
        nextSelected.delete(userId);
      } else {
        nextSelected.add(userId);
      }
      return nextSelected;
    });
  }, []);

  // Handle template selection
  const handleTemplateChange = (templateKey) => {
    setSelectedTemplate(templateKey);
    const template = EMAIL_TEMPLATES[templateKey];
    setEmailSubject(template.subject);
    setEmailBody(template.body);
  };

  // Preprocess email body - replace variables with user data
  const preprocessEmailBody = (body, userData) => {
    return body
      .replace(/{{user_name}}/g, userData.student_name || '')
      .replace(/{{user_email}}/g, userData.email || '')
      .replace(/{{studies_name}}/g, userData.studies_name || '')
      .replace(/{{start_date}}/g, ''); // This would come from backend
  };

  // Check if body contains template variables
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

  const parseNotificationResult = (response, requestedEmails = []) => {
    const failedEmailsRaw = response?.data?.failed_emails;
    const failedEmails = Array.isArray(failedEmailsRaw) ? failedEmailsRaw : [];

    const sentCountRaw = Number(response?.data?.sent_count);
    const sentCount = Number.isFinite(sentCountRaw)
      ? sentCountRaw
      : Math.max(0, requestedEmails.length - failedEmails.length);

    const failedEmailSet = new Set(failedEmails);
    const successCount = requestedEmails.filter((e) => !failedEmailSet.has(e)).length;

    return { failedEmails, sentCount, successCount };
  };

  // Send notifications
  const handleSendNotifications = async () => {
    if (selectedUserIds.size === 0) {
      alert('Wybierz przynajmniej jednego użytkownika');
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

    setSending(true);
    try {
      const selectedEnrollments = filteredEnrollments.filter(e => selectedUserIds.has(e.id));
      const hasVariables = hasTemplateVariables(emailBody);

      // Use emails already available in row data (from export endpoint)
      const usersToNotify = selectedEnrollments.map((enrollment) => ({
        email: enrollment.email || '',
        student_name: enrollment.student_name,
        studies_name: enrollment.studies_name
      }));

      const usersWithEmail = usersToNotify.filter(u => u.email);
      const skippedUsers = usersToNotify.filter(u => !u.email);

      if (usersWithEmail.length === 0) {
        alert('Brak adresów email dla wybranych kandydatów. Wysyłka została przerwana.');
        return;
      }

      if (hasVariables) {
        // Send separate requests for each user with preprocessed content
        const failedUsers = [];
        let sentUsersCount = 0;
        for (const user of usersWithEmail) {
          const processedBody = preprocessEmailBody(emailBody, user);
          const response = await serverApi.sendNotification({
            emails: [user.email],
            notification_subject: emailSubject,
            notification_body: processedBody,
            use_own_name_as_sender: useSenderName
          });

          if (response.error) {
            failedUsers.push(user.student_name);
            continue;
          }

          const { failedEmails, successCount } = parseNotificationResult(response, [user.email]);
          if (failedEmails.includes(user.email) || successCount < 1) {
            failedUsers.push(user.student_name);
          } else {
            sentUsersCount += 1;
          }
        }

        if (failedUsers.length > 0) {
          const skippedInfo = skippedUsers.length > 0 ? `, Pominięto bez emaila: ${skippedUsers.length}` : '';
          alert(`Wysłane dla: ${sentUsersCount}, Błędy: ${failedUsers.join(', ')}${skippedInfo}`);
        } else if (skippedUsers.length > 0) {
          alert(`Wiadomości wysłane dla ${sentUsersCount} użytkowników. Pominięto ${skippedUsers.length} bez emaila.`);
        } else {
          alert(`Wiadomości wysłane pomyślnie dla ${sentUsersCount} użytkowników`);
        }
      } else {
        // Send single request for all users
        const emails = [...new Set(usersWithEmail.map(u => u.email))];
        const response = await serverApi.sendNotification({
          emails,
          notification_subject: emailSubject,
          notification_body: emailBody,
          use_own_name_as_sender: useSenderName
        });

        if (response.error) {
          throw new Error(response.errorMsg || 'Błąd podczas wysyłania wiadomości');
        }

        const { failedEmails, sentCount, successCount } = parseNotificationResult(response, emails);
        const failedNames = usersWithEmail
          .filter((u) => failedEmails.includes(u.email))
          .map((u) => u.student_name)
          .filter(Boolean);
        const failedLabel = failedNames.length > 0 ? ` (${failedNames.join(', ')})` : '';

        if (failedEmails.length > 0) {
          const skippedInfo = skippedUsers.length > 0 ? `, Pominięto bez emaila: ${skippedUsers.length}` : '';
          alert(`Wysłane: ${Math.max(sentCount, successCount)}, Błędy dla ${failedEmails.length} użytkowników${failedLabel}${skippedInfo}`);
        } else if (skippedUsers.length > 0) {
          alert(`Wysłane: ${Math.max(sentCount, successCount)}. Pominięto bez emaila: ${skippedUsers.length}`);
        } else {
          alert(`Wiadomości wysłane pomyślnie dla ${Math.max(sentCount, successCount)} użytkowników`);
        }
      }

      setShowModal(false);
      setSelectedUserIds(new Set());
      setAllSelected(false);
    } catch (error) {
      console.error('Error sending notifications:', error);
      alert('Błąd podczas wysyłania wiadomości: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className='account-page-layout admin-notifications-layout'>
        <AccountPageLeftMenu />
        <div className='account-column' id='account-page-column-middle'>
          <p>Wczytywanie danych...</p>
        </div>
      </div>
    );
  }

  if (!userLoggedIn) {
    return <LoginRedirectPage />;
  }

  return (
    <div className='account-page-layout admin-notifications-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <div className='page-title'>Wysyłanie maili</div>
        <p className='admin-notifications-subtitle'>
          Filtruj kandydatów, wybierz odbiorców i wyślij powiadomienie e-mail.
        </p>

      {/* Filters Section */}
      <section className="bg-panel admin-notifications-panel admin-notifications-filters">
        <div className="filters-left">
          <div className="filter-group filter-select">
            <label>Kierunek:</label>
            <select value={filterByEdition} onChange={(e) => setFilterByEdition(e.target.value)}>
              <option value="">Wszystkie kierunki</option>
              {editions.map(edition => (
                <option key={edition} value={edition}>{edition}</option>
              ))}
            </select>
          </div>

          <div className="filter-group filter-select">
            <label>Status:</label>
            <select value={filterByStatus} onChange={(e) => setFilterByStatus(e.target.value)}>
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filters-right">
          <div className="filter-group filter-checkbox">
            <label>
              <input
                type="checkbox"
                checked={filterMissingDocs}
                onChange={(e) => setFilterMissingDocs(e.target.checked)}
              />
              Tylko z brakującymi dokumentami
            </label>
          </div>

          <div className="filter-group filter-checkbox">
            <label>
              <input
                type="checkbox"
                checked={filterMissingPayment}
                onChange={(e) => setFilterMissingPayment(e.target.checked)}
              />
              Tylko z nieopłaconymi opłatami
            </label>
          </div>
        </div>
      </section>

      {/* Preview Table Section */}
      <section className="bg-panel admin-notifications-panel admin-notifications-table-section">
        <div className="table-header">
          <h2>Kandydaci ({filteredEnrollments.length})</h2>
          <div className="selection-info">
            {selectedUserIds.size > 0 && (
              <span>Zaznaczono: {selectedUserIds.size} / {filteredEnrollments.length}</span>
            )}
          </div>
        </div>

        <table className="admin-notifications-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={allSelected && filteredEnrollments.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>Imię i nazwisko</th>
              <th>Email</th>
              <th>Kierunek</th>
              <th>Status</th>
              <th>Dokumenty</th>
              <th>Opłaty</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-state">Brak wyników spełniających kryteria</td>
              </tr>
            ) : (
              filteredEnrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(enrollment.id)}
                      onChange={() => handleSelectUser(enrollment.id)}
                    />
                  </td>
                  <td>{enrollment.student_name}</td>
                  <td>{enrollment.email || '-'}</td>
                  <td>{enrollment.studies_name}</td>
                  <td>{enrollment.status}</td>
                  <td className={!enrollment.missing_documents ? 'status-ok' : 'status-missing'}>
                    {!enrollment.missing_documents ? '✓ Kompletne' : '✗ Brakujące'}
                  </td>
                  <td className={enrollment.is_fully_paid ? 'status-ok' : 'status-missing'}>
                    {enrollment.is_fully_paid ? '✓ Opłacone' : '✗ Nieopłacone'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Send Button */}
      <div className="admin-notifications-actions">
        <button
          className="btn-send"
          onClick={() => setShowModal(true)}
          disabled={selectedUserIds.size === 0}
        >
          Wyślij wiadomość ({selectedUserIds.size})
        </button>
      </div>
      </div>

      {/* Email Composition Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Komponowanie wiadomości</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              {/* Template Selection */}
              <div className="form-group">
                <label>Szablon wiadomości:</label>
                <select value={selectedTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
                  {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                    <option key={key} value={key}>{template.label}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label>Temat:</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Wprowadź temat wiadomości"
                />
              </div>

              {/* Body */}
              <div className="form-group">
                <label>Treść wiadomości:</label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Wprowadź treść wiadomości"
                  rows="8"
                />
              </div>

              {/* Available Variables */}
              <div className="variables-hint">
                <strong>Dostępne zmienne szablonu:</strong>
                <div className="variables-list">
                  {AVAILABLE_VARIABLES.map(variable => (
                    <code key={variable.key} onClick={() => setEmailBody(emailBody + ' ' + variable.key)}>
                      {variable.key} - {variable.label}
                    </code>
                  ))}
                </div>
              </div>

              {/* Sender Option */}
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={useSenderName}
                    onChange={(e) => setUseSenderName(e.target.checked)}
                  />
                  Użyj mojego imienia i nazwiska w podpisie
                </label>
              </div>

              {/* Preview Section */}
              {selectedUserIds.size > 0 && (
                <div className="preview-section">
                  <strong>Podgląd wiadomości:</strong>
                  <div className="preview-box">
                    <p><strong>Temat:</strong> {emailSubject}</p>
                    <p><strong>Treść:</strong></p>
                    <pre>
                      {buildMailPreview(
                        emailBody,
                        filteredEnrollments.find((item) => selectedUserIds.has(item.id)) || {}
                      )}
                    </pre>
                    {hasTemplateVariables(emailBody) && (
                      <div className="preview-note">
                        Zmienne szablonu zostaną zastąpione danymi każdego kandydata przy wysyłaniu.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
                disabled={sending}
              >
                Anuluj
              </button>
              <button
                className="btn-send"
                onClick={handleSendNotifications}
                disabled={sending || selectedUserIds.size === 0}
              >
                {sending ? 'Wysyłanie...' : `Wyślij dla ${selectedUserIds.size} kandydatów`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
