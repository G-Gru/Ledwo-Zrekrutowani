import { useEffect, useState } from 'react';
import { getAccessToken } from '../services/authService';
import { serverApi } from '../services/serverApi';
import AccountPageLeftMenu from '../components/AccountPageLeftMenu';
import '../styles/Style.css';
import { toDateTimeLocalInWarsaw } from '../utils/dateTime';
import {BASE_URL} from "../api/client.js";

const sampleStudies = [
  {
    id: 1,
    name: 'Informatyka',
    terms_count: 7,
    description: 'Programowanie, systemy operacyjne, bazy danych i inżynieria oprogramowania.',
    organizational_unit: 'INF'
  },
  {
    id: 2,
    name: 'Analiza Danych',
    terms_count: 4,
    description: 'Uczenie maszynowe, statystyka i przetwarzanie dużych zbiorów danych.',
    organizational_unit: 'INF'
  }
];

const sampleEditions = [
  {
    id: 1,
    name: 'Informatyka - studia I stopnia',
    status: 'ACTIVE',
    studies_id: 1,
    price: '5000.00',
    start_date: '2024-10-01',
    end_date: '2028-06-30',
    max_participants: 50,
    syllabus_url: 'https://example.com/syllabus',
    recruitment_start_date: '2024-05-01T00:00:00Z',
    recruitment_end_date: '2024-09-30T23:59:59Z',
    academic_year: '2024/2025'
  },
  {
    id: 2,
    name: 'Analiza danych - studia magisterskie',
    status: 'HIDDEN',
    studies_id: 2,
    price: '5200.00',
    start_date: '2025-03-01',
    end_date: '2027-12-31',
    max_participants: 40,
    syllabus_url: 'https://example.com/syllabus-2',
    recruitment_start_date: '2024-09-01T00:00:00Z',
    recruitment_end_date: '2025-02-28T23:59:59Z',
    academic_year: '2025/2026'
  }
];

const sampleEditionStaffByEdition = {
  1: [
    {
      id: 1,
      role: 'STUDIES_DIRECTOR',
      user: {
        first_name: 'Anna',
        last_name: 'Kowalska',
        email: 'anna.kowalska@agh.edu.pl',
        phone: '+48 600 111 222'
      }
    },
    {
      id: 2,
      role: 'ADMINISTRATIVE_COORDINATOR',
      user: {
        first_name: 'Piotr',
        last_name: 'Nowak',
        email: 'piotr.nowak@agh.edu.pl',
        phone: '+48 600 333 444'
      }
    }
  ],
  2: [
    {
      id: 3,
      role: 'FINANCE_COORDINATOR',
      user: {
        first_name: 'Magdalena',
        last_name: 'Wisniewska',
        email: 'magdalena.wisniewska@agh.edu.pl',
        phone: '+48 600 555 666'
      }
    }
  ]
};

const emptyEditionForm = {
  studies_id: '',
  price: '',
  start_date: '',
  end_date: '',
  max_participants: '',
  status: 'HIDDEN',
  syllabus_url: '',
  recruitment_start_date: '',
  recruitment_end_date: '',
  academic_year: '',
};

const emptyStaffForm = {
  user_id: '',
  role: 'ADMINISTRATIVE_COORDINATOR'
};

const sampleUsers = [
  { id: 1, first_name: 'Anna', last_name: 'Kowalska', email: 'anna.kowalska@agh.edu.pl' },
  { id: 2, first_name: 'Piotr', last_name: 'Nowak', email: 'piotr.nowak@agh.edu.pl' },
];

const staffRoleLabels = {
  STUDIES_DIRECTOR: 'Kierownik studiow',
  ADMINISTRATIVE_COORDINATOR: 'Koordynator administracyjny',
  FINANCE_COORDINATOR: 'Koordynator finansowy'
};

const API_BASE_URL = BASE_URL.replace(/\/$/, '');
const getApiUrl = (path) => `${API_BASE_URL}/api${path}`;

export default function ManageStudiesEditions() {
  const [studies, setStudies] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [editionFormData, setEditionFormData] = useState(emptyEditionForm);
  const [editions, setEditions] = useState([]);
  const [editionStaff, setEditionStaff] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [staffFormData, setStaffFormData] = useState(emptyStaffForm);
  const [loadingEditionSubmit, setLoadingEditionSubmit] = useState(false);
  const [loadingStaffSubmit, setLoadingStaffSubmit] = useState(false);

  const [editionsError, setEditionsError] = useState('');
  const [staffError, setStaffError] = useState('');
  const [editionsPermissionMessage, setEditionsPermissionMessage] = useState('');
  const [staffPermissionMessage, setStaffPermissionMessage] = useState('');

  const [canViewEditions, setCanViewEditions] = useState(true);
  const [canCreateEdition, setCanCreateEdition] = useState(true);
  const [canModifyEdition, setCanModifyEdition] = useState(true);
  const [canViewEditionStaff, setCanViewEditionStaff] = useState(true);
  const [canCreateEditionStaff, setCanCreateEditionStaff] = useState(true);

  const token = getAccessToken();

  const toDateTimeLocal = (value) => {
    return toDateTimeLocalInWarsaw(value);
  };

  const mapEditionToForm = (edition) => ({
    studies_id: edition?.studies_id || '',
    price: edition?.price || '',
    start_date: edition?.start_date || '',
    end_date: edition?.end_date || '',
    max_participants: edition?.max_participants || '',
    status: edition?.status || 'HIDDEN',
    syllabus_url: edition?.syllabus_url || '',
    recruitment_start_date: toDateTimeLocal(edition?.recruitment_start_date),
    recruitment_end_date: toDateTimeLocal(edition?.recruitment_end_date),
    academic_year: edition?.academic_year || '',
  });

  const fetchStudies = async () => {
    try {
      const res = await serverApi.apiRequest('/api/admin/studies/', 'GET', null, token, true, false, false);

      if (res.status === 403) {
        setStudies([]);
        setEditionsPermissionMessage('Brak uprawnień administratora do podglądu kierunków studiów.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setStudies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch studies error:', err);
      setStudies(sampleStudies);
    }
  };

  const fetchEditions = async () => {
    try {
      const res = await serverApi.apiRequest('/api/admin/studies/editions/', 'GET', null, token, true, false, false);

      if (res.status === 403) {
        setCanViewEditions(false);
        setEditions([]);
        setEditionsPermissionMessage('Brak uprawnień do podglądu edycji studiów.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setEditions(Array.isArray(data) ? data : []);
      setCanViewEditions(true);
      setEditionsPermissionMessage('');
      setEditionsError('');
    } catch (err) {
      console.error('Fetch editions error:', err);
      setEditions(sampleEditions);
      setEditionsError('Nie udało się załadować edycji z backendu. Widoczne dane testowe.');
    }
  };

  const fetchEditionStaff = async (editionId) => {
    if (!editionId) {
      setEditionStaff([]);
      return;
    }

    try {
      const res = await fetch(getApiUrl(`/admin/studies/editions/${editionId}/staff/`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 403) {
        setCanViewEditionStaff(false);
        setEditionStaff([]);
        setStaffPermissionMessage('Brak uprawnien do podgladu personelu tej edycji.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setEditionStaff(Array.isArray(data) ? data : []);
      setCanViewEditionStaff(true);
      setStaffPermissionMessage('');
      setStaffError('');
    } catch (err) {
      console.error('Fetch edition staff error:', err);
      setEditionStaff(sampleEditionStaffByEdition[editionId] || []);
      setStaffError('Nie udalo sie zaladowac personelu edycji. Widoczne dane testowe.');
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await serverApi.apiRequest('/api/admin/users/', 'GET', null, token, true, false, false);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Fetch all users failed, using sample data', err);
      setAllUsers(sampleUsers);
    }
  };

  useEffect(() => {
    fetchStudies();
    fetchEditions();
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetEditionForm = () => {
    setSelectedEdition(null);
    setEditionFormData(emptyEditionForm);
    setEditionStaff([]);
    setStaffFormData(emptyStaffForm);
    setStaffPermissionMessage('');
    setStaffError('');
    setCanViewEditionStaff(true);
    setCanCreateEditionStaff(true);
  };

  const startEdit = async (edition) => {
    setSelectedEdition(edition);
    setEditionFormData(mapEditionToForm(edition));
    setStaffFormData(emptyStaffForm);
    setCanViewEditionStaff(true);
    setCanCreateEditionStaff(true);
    fetchEditionStaff(edition.id);

    try {
      const res = await serverApi.apiRequest(`/api/admin/studies/editions/${edition.id}/`, 'GET', null, token, true, false, false);

      if (res.status === 403) {
        setCanModifyEdition(false);
        setEditionsPermissionMessage('Twoja rola nie ma uprawnień do edycji tej edycji.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setEditionFormData((prev) => ({
        ...prev,
        ...mapEditionToForm(data),
        studies_id: prev.studies_id || edition.studies_id || ''
      }));
    } catch (err) {
      console.error('Fetch edition details error:', err);
    }
  };

  const onDelete = async (edition) => {
    if (!window.confirm(`Czy na pewno usunąć ofertę "${edition.name}"?`)) return;

    try {
      const res = await serverApi.apiRequest(`/api/admin/studies/editions/${edition.id}/`, 'DELETE', null, token, true, false, false);

      if (res.status === 403) {
        setCanModifyEdition(false);
        setEditionsPermissionMessage('Twoja rola nie ma uprawnień do usuwania edycji.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      fetchEditions();
      if (selectedEdition?.id === edition.id) resetEditionForm();
    } catch (err) {
      console.error('Delete edition error:', err);
      alert('Nie udało się usunąć oferty.');
    }
  };

  const handleEditionChange = (e) => {
    const { name, value } = e.target;
    setEditionFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStaffChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEdition) return;

    setLoadingStaffSubmit(true);

    try {
      const payload = {
        user_id: Number(staffFormData.user_id),
        role: staffFormData.role
      };

      const res = await serverApi.apiRequest(`/api/admin/studies/editions/${selectedEdition.id}/staff/`, 'POST', payload, token, true, false, false);
      if (res.status === 403) {
        setCanCreateEditionStaff(false);
        setStaffPermissionMessage('Twoja rola nie ma uprawnien do dodawania personelu.');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      alert('Pracownik zostal dodany do edycji.');
      setStaffFormData(emptyStaffForm);
      fetchEditionStaff(selectedEdition.id);
    } catch (err) {
      console.error('Submit edition staff error:', err);
      alert('Wystapil blad podczas dodawania pracownika do edycji.');
    } finally {
      setLoadingStaffSubmit(false);
    }
  };

  const onStaffDelete = async (staffItem) => {
    if (!selectedEdition) return;
    const fullName = [staffItem?.user?.first_name, staffItem?.user?.last_name].filter(Boolean).join(' ');
    if (!window.confirm(`Czy na pewno usunąć ${fullName || 'tego pracownika'} z edycji?`)) return;

    try {
      const res = await serverApi.apiRequest(`/api/admin/studies/editions/${selectedEdition.id}/staff/${staffItem.id}/`, 'DELETE', null, token, true, false, false);

      if (res.status === 403) {
        setCanCreateEditionStaff(false);
        setStaffPermissionMessage('Twoja rola nie ma uprawnień do usuwania pracowników z edycji.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      fetchEditionStaff(selectedEdition.id);
    } catch (err) {
      console.error('Delete edition staff error:', err);
      alert('Nie udało się usunąć pracownika z edycji.');
    }
  };

  const handleEditionSubmit = async (e) => {
    e.preventDefault();
    setLoadingEditionSubmit(true);

    try {
      const method = selectedEdition ? 'PUT' : 'POST';
      const url = selectedEdition
        ? `/api/admin/studies/editions/${selectedEdition.id}/`
        : '/api/admin/studies/editions/';

      const payload = selectedEdition
        ? {
            price: editionFormData.price,
            start_date: editionFormData.start_date,
            end_date: editionFormData.end_date,
            max_participants: Number(editionFormData.max_participants),
            status: editionFormData.status,
            syllabus_url: editionFormData.syllabus_url,
            recruitment_start_date: editionFormData.recruitment_start_date,
            recruitment_end_date: editionFormData.recruitment_end_date,
            academic_year: editionFormData.academic_year,
          }
        : {
            studies_id: Number(editionFormData.studies_id),
            price: editionFormData.price,
            start_date: editionFormData.start_date,
            end_date: editionFormData.end_date,
            max_participants: Number(editionFormData.max_participants),
            status: editionFormData.status,
            syllabus_url: editionFormData.syllabus_url,
            recruitment_start_date: editionFormData.recruitment_start_date,
            recruitment_end_date: editionFormData.recruitment_end_date,
            academic_year: editionFormData.academic_year,
          };

      const res = await serverApi.apiRequest(url, method, payload, token, true, false, false);

      if (res.status === 403) {
        if (selectedEdition) {
          setCanModifyEdition(false);
          setEditionsPermissionMessage('Twoja rola nie ma uprawnień do edycji edycji studiów.');
        } else {
          setCanCreateEdition(false);
          setEditionsPermissionMessage('Tylko administrator może tworzyć nowe edycje studiów.');
        }
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      alert(`Oferta została ${selectedEdition ? 'zaktualizowana' : 'utworzona'}!`);
      resetEditionForm();
      fetchEditions();
    } catch (err) {
      console.error('Submit edition error:', err);
      alert('Wystąpił błąd podczas zapisu oferty.');
    } finally {
      setLoadingEditionSubmit(false);
    }
  };

  return (
    <div className='account-page-layout manage-studies-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <h2 className="page-title">Edycje studiów</h2>

        {editionsError && <div className="error-message">{editionsError}</div>}
        {staffError && <div className="error-message">{staffError}</div>}

        {canViewEditions ? (
          <>
          <section className="bg-panel manage-table">
            <h3>Aktualne edycje</h3>
            {editionsPermissionMessage && <div className="error-message">{editionsPermissionMessage}</div>}
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Nazwa kierunku</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {editions.map((edition) => (
                  <tr key={edition.id} className={selectedEdition?.id === edition.id ? 'selected-row' : ''}>
                    <td>{edition.name}</td>
                    <td>{edition.status}</td>
                    <td>
                      {canModifyEdition && (
                        <>
                          <button type="button" className="button-secondary" onClick={() => startEdit(edition)}>
                            Edytuj
                          </button>
                          <button type="button" className="button-danger" onClick={() => onDelete(edition)}>
                            Usuń
                          </button>
                        </>
                      )}
                      {!canModifyEdition && '-'}
                    </td>
                  </tr>
                ))}
                {editions.length === 0 && (
                  <tr>
                    <td colSpan="3">Brak ofert do wyświetlenia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {(canCreateEdition || selectedEdition) && (
            <section className="bg-panel">
              <h3>{selectedEdition ? 'Edytuj ofertę' : 'Dodaj nową ofertę'}</h3>
              <form onSubmit={handleEditionSubmit} className="form-container">
                {!selectedEdition && (
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="studies_id">Kierunek studiów *</label>
                      <select
                        id="studies_id"
                        name="studies_id"
                        value={editionFormData.studies_id}
                        onChange={handleEditionChange}
                        required
                      >
                        <option value="">Wybierz kierunek</option>
                        {studies.length === 0 && (
                          <option value="" disabled>
                            Brak dostępnych kierunków
                          </option>
                        )}
                        {studies.map((study) => (
                          <option key={study.id} value={study.id}>
                            {study.id} - {study.name}
                          </option>
                        ))}
                      </select>
                    </div>

                  <div className="form-group">
                      <label htmlFor="academic_year">Rok akademicki *</label>
                      <input
                          type="text"
                          id="academic_year"
                          name="academic_year"
                          value={editionFormData.academic_year}
                          onChange={handleEditionChange}
                          required
                      />
                  </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price">Cena (PLN) *</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      step="0.01"
                      min="0"
                      value={editionFormData.price}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_participants">Limit uczestników *</label>
                    <input
                      type="number"
                      id="max_participants"
                      name="max_participants"
                      min="1"
                      value={editionFormData.max_participants}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_date">Data rozpoczęcia studiów *</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={editionFormData.start_date}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date">Data zakończenia studiów *</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={editionFormData.end_date}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                      id="status"
                      name="status"
                      value={editionFormData.status}
                      onChange={handleEditionChange}
                      required
                    >
                      <option value="HIDDEN">Ukryty</option>
                      <option value="ACTIVE">Aktywny</option>
                      <option value="CLOSED">Zamknięty</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="syllabus_url">Link do sylabusa *</label>
                    <input
                      type="url"
                      id="syllabus_url"
                      name="syllabus_url"
                      placeholder="https://example.com/syllabus"
                      value={editionFormData.syllabus_url}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="recruitment_start_date">Początek rekrutacji *</label>
                    <input
                      type="datetime-local"
                      id="recruitment_start_date"
                      name="recruitment_start_date"
                      value={editionFormData.recruitment_start_date}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="recruitment_end_date">Koniec rekrutacji *</label>
                    <input
                      type="datetime-local"
                      id="recruitment_end_date"
                      name="recruitment_end_date"
                      value={editionFormData.recruitment_end_date}
                      onChange={handleEditionChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" onClick={resetEditionForm} className="button-secondary">
                    Anuluj
                  </button>
                  <button type="submit" disabled={loadingEditionSubmit} className="button-primary">
                    {selectedEdition ? 'Aktualizuj ofertę' : 'Stwórz ofertę'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {selectedEdition && (
            <section className="bg-panel manage-table">
              <h3>Zespol edycji: {selectedEdition.name}</h3>
              {staffPermissionMessage && <div className="error-message">{staffPermissionMessage}</div>}

              {canViewEditionStaff ? (
                <table className="styled-table">
                  <thead>
                    <tr>
                      <th>Rola</th>
                      <th>Imie i nazwisko</th>
                      <th>E-mail</th>
                      <th>Telefon</th>
                      <th>Akcje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editionStaff.map((staffItem) => {
                      const fullName = [staffItem?.user?.first_name, staffItem?.user?.last_name]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <tr key={staffItem.id}>
                          <td>{staffRoleLabels[staffItem.role] || staffItem.role || '-'}</td>
                          <td>{fullName || '-'}</td>
                          <td>{staffItem?.user?.email || '-'}</td>
                          <td>{staffItem?.user?.phone || '-'}</td>
                          <td>
                            {canCreateEditionStaff && (
                              <button
                                type="button"
                                className="button-danger"
                                onClick={() => onStaffDelete(staffItem)}
                              >
                                Usuń
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {editionStaff.length === 0 && (
                      <tr>
                        <td colSpan="4">Brak przypisanego personelu dla tej edycji.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <p>Brak uprawnien do podgladu personelu tej edycji.</p>
              )}

              {canViewEditionStaff && canCreateEditionStaff && (
                <form onSubmit={handleStaffSubmit} className="form-container" style={{ marginTop: '1rem' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="staff_user_id">Pracownik *</label>
                      <select
                        id="staff_user_id"
                        name="user_id"
                        value={staffFormData.user_id}
                        onChange={handleStaffChange}
                        required
                      >
                        <option value="">Wybierz pracownika</option>
                        {allUsers.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.first_name} {u.last_name} ({u.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="staff_role">Rola *</label>
                      <select
                        id="staff_role"
                        name="role"
                        value={staffFormData.role}
                        onChange={handleStaffChange}
                        required
                      >
                        <option value="STUDIES_DIRECTOR">Kierownik studiow</option>
                        <option value="ADMINISTRATIVE_COORDINATOR">Koordynator administracyjny</option>
                        <option value="FINANCE_COORDINATOR">Koordynator finansowy</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="button" onClick={() => setStaffFormData(emptyStaffForm)} className="button-secondary">
                      Wyczyść
                    </button>
                    <button type="submit" disabled={loadingStaffSubmit} className="button-primary">
                      Dodaj pracownika
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
          </>
        ) : (
          <section className="bg-panel">
            <h3>Edycje studiów</h3>
            <p>{editionsPermissionMessage || 'Brak uprawnień do podglądu edycji studiów.'}</p>
          </section>
        )}

        {canViewEditions && !canCreateEdition && !selectedEdition && (
          <section className="bg-panel">
            <p>Tworzenie nowych edycji jest dostępne tylko dla administratora.</p>
          </section>
        )}
      </div>
    </div>
  );
}
