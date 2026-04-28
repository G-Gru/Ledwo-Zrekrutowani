import { useEffect, useState } from 'react';
import AccountPageLeftMenu from '../components/AccountPageLeftMenu';
import '../styles/Style.css';

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

const emptyStudyForm = {
  name: '',
  terms_count: '',
  description: '',
  organizational_unit: '',
};

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const getApiUrl = (path) => `${API_BASE_URL}/api${path}`;

export default function ManageStudiesOffers() {
  const [studies, setStudies] = useState([]);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [studyFormData, setStudyFormData] = useState(emptyStudyForm);
  const [loadingStudySubmit, setLoadingStudySubmit] = useState(false);

  const [studiesError, setStudiesError] = useState('');
  const [studiesPermissionMessage, setStudiesPermissionMessage] = useState('');

  const [canViewStudies, setCanViewStudies] = useState(true);

  const token = localStorage.getItem('user-access-token') || localStorage.getItem('token');

  const mapStudyToForm = (study) => ({
    name: study?.name || '',
    terms_count: study?.terms_count || '',
    description: study?.description || '',
    organizational_unit: study?.organizational_unit || '',
  });

  const fetchStudies = async () => {
    try {
      const res = await fetch(getApiUrl('/admin/studies/'), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 403) {
        setCanViewStudies(false);
        setStudies([]);
        setStudiesPermissionMessage('Brak uprawnień administratora do zarządzania kierunkami studiów.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setStudies(Array.isArray(data) ? data : []);
      setCanViewStudies(true);
      setStudiesPermissionMessage('');
      setStudiesError('');
    } catch (err) {
      console.error('Fetch studies error:', err);
      setStudies(sampleStudies);
      setStudiesError('Nie udało się załadować kierunków z backendu. Widoczne dane testowe.');
    }
  };

  useEffect(() => {
    fetchStudies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetStudyForm = () => {
    setSelectedStudy(null);
    setStudyFormData(emptyStudyForm);
  };

  const startStudyEdit = (study) => {
    setSelectedStudy(study);
    setStudyFormData(mapStudyToForm(study));
  };

  const onStudyDelete = async (study) => {
    if (!window.confirm(`Czy na pewno usunąć kierunek "${study.name}"?`)) return;

    try {
      const res = await fetch(getApiUrl(`/admin/studies/${study.id}/`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 403) {
        setStudiesPermissionMessage('Brak uprawnień administratora do usuwania kierunków.');
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      fetchStudies();
      if (selectedStudy?.id === study.id) resetStudyForm();
    } catch (err) {
      console.error('Delete study error:', err);
      alert('Nie udało się usunąć kierunku studiów.');
    }
  };

  const startEdit = async (edition) => {
    setSelectedEdition(edition);
    setEditionFormData(mapEditionToForm(edition));
    setStaffFormData(emptyStaffForm);
    setCanViewEditionStaff(true);
    setCanCreateEditionStaff(true);
    fetchEditionStaff(edition.id);

    try {
      const res = await fetch(getApiUrl(`/admin/studies/editions/${edition.id}/`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

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
    if (!window.confirm(`Czy na pewno usunąć ofertę “${edition.name}”?`)) return;

    try {
      const res = await fetch(getApiUrl(`/admin/studies/editions/${edition.id}/`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

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

  const handleStudyChange = (e) => {
    const { name, value } = e.target;
    setStudyFormData((prev) => ({ ...prev, [name]: value }));
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

      const res = await fetch(getApiUrl(`/admin/studies/editions/${selectedEdition.id}/staff/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

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
      const res = await fetch(getApiUrl(`/admin/studies/editions/${selectedEdition.id}/staff/${staffItem.id}/`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

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

  const handleStudySubmit = async (e) => {
    e.preventDefault();
    setLoadingStudySubmit(true);

    try {
      const method = selectedStudy ? 'PUT' : 'POST';
      const url = selectedStudy
        ? getApiUrl(`/admin/studies/${selectedStudy.id}/`)
        : getApiUrl('/admin/studies/');

      const payload = {
        name: studyFormData.name,
        terms_count: Number(studyFormData.terms_count),
        description: studyFormData.description,
        organizational_unit: studyFormData.organizational_unit,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 403) {
        setStudiesPermissionMessage('Brak uprawnień administratora do zapisu kierunków.');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      alert(`Kierunek został ${selectedStudy ? 'zaktualizowany' : 'utworzony'}!`);
      resetStudyForm();
      fetchStudies();
    } catch (err) {
      console.error('Submit study error:', err);
      alert('Wystąpił błąd podczas zapisu kierunku studiów.');
    } finally {
      setLoadingStudySubmit(false);
    }
  };

  const handleEditionSubmit = async (e) => {
    e.preventDefault();
    setLoadingEditionSubmit(true);

    try {
      const method = selectedEdition ? 'PUT' : 'POST';
      const url = selectedEdition
        ? getApiUrl(`/admin/studies/editions/${selectedEdition.id}/`)
        : getApiUrl('/admin/studies/editions/');

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

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

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
        <h2 className="page-title">Kierunki studiów</h2>

        {studiesError && <div className="error-message">{studiesError}</div>}

        {canViewStudies ? (
          <>
          <section className="bg-panel manage-table">
            <h3>Kierunki studiów (admin)</h3>
            {studiesPermissionMessage && <div className="error-message">{studiesPermissionMessage}</div>}
            <table className="styled-table">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '36%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nazwa</th>
                  <th>Liczba semestrów</th>
                  <th>Opis</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                {studies.map((study) => (
                  <tr key={study.id} className={selectedStudy?.id === study.id ? 'selected-row' : ''}>
                    <td>{study.id}</td>
                    <td>{study.name}</td>
                    <td>{study.terms_count}</td>
                    <td>{study.description || '-'}</td>
                    <td>
                      <button type="button" className="button-secondary" onClick={() => startStudyEdit(study)}>
                        Edytuj
                      </button>
                      <button type="button" className="button-danger" onClick={() => onStudyDelete(study)}>
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
                {studies.length === 0 && (
                  <tr>
                    <td colSpan="5">Brak kierunków do wyświetlenia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="bg-panel">
            <h3>{selectedStudy ? 'Edytuj kierunek studiów' : 'Dodaj nowy kierunek studiów'}</h3>
            <form onSubmit={handleStudySubmit} className="form-container">
                <div className="form-group">
                  <label htmlFor="study_name">Nazwa kierunku *</label>
                  <input
                    type="text"
                    id="study_name"
                    name="name"
                    value={studyFormData.name}
                    onChange={handleStudyChange}
                    required
                  />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="terms_count">Liczba semestrów *</label>
                        <input
                            type="number"
                            id="terms_count"
                            name="terms_count"
                            min="1"
                            value={studyFormData.terms_count}
                            onChange={handleStudyChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="organizational_unit">Jednostka ogranizacyjna *</label>
                        <input
                            type="text"
                            id="organizational_unit"
                            name="organizational_unit"
                            value={studyFormData.organizational_unit}
                            onChange={handleStudyChange}
                            required
                        />
                    </div>
                </div>

              <div className="form-group">
                <label htmlFor="study_description">Opis *</label>
                <input
                  type="text"
                  id="study_description"
                  name="description"
                  value={studyFormData.description}
                  onChange={handleStudyChange}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetStudyForm} className="button-secondary">
                  Anuluj
                </button>
                <button type="submit" disabled={loadingStudySubmit} className="button-primary">
                  {selectedStudy ? 'Aktualizuj kierunek' : 'Stwórz kierunek'}
                </button>
              </div>
            </form>
          </section>
          </>
        ) : (
          <section className="bg-panel">
            <h3>Kierunki studiów</h3>
            <p>{studiesPermissionMessage || 'Brak uprawnień do zarządzania kierunkami studiów.'}</p>
          </section>
        )}
      </div>
    </div>
  );
}