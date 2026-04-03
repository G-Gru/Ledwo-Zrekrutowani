import { useEffect, useState } from 'react';
import '../styles/Style.css';

const sampleEditions = [
  {
    id: 1,
    name: 'Informatyka - studia I stopnia',
    status: 'ACTIVE',
    price: '5000.00',
    start_date: '2024-10-01',
    end_date: '2028-06-30',
    max_participants: 50,
    syllabus_url: 'https://example.com/syllabus',
    recruitment_start_date: '2024-05-01T00:00:00Z',
    recruitment_end_date: '2024-09-30T23:59:59Z'
  },
  {
    id: 2,
    name: 'Analiza danych - studia magisterskie',
    status: 'HIDDEN',
    price: '5200.00',
    start_date: '2025-03-01',
    end_date: '2027-12-31',
    max_participants: 40,
    syllabus_url: 'https://example.com/syllabus-2',
    recruitment_start_date: '2024-09-01T00:00:00Z',
    recruitment_end_date: '2025-02-28T23:59:59Z'
  }
];

export default function ManageStudiesOffers() {
  const [editions, setEditions] = useState([]);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [formData, setFormData] = useState({
    studies_id: '',
    studies_name: '',
    price: '',
    start_date: '',
    end_date: '',
    max_participants: '',
    status: 'HIDDEN',
    syllabus_url: '',
    recruitment_start_date: '',
    recruitment_end_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const mapEditionToForm = (edition) => ({
    studies_id: edition?.studies_id || '',
    studies_name: edition?.name || '',
    price: edition?.price || '',
    start_date: edition?.start_date || '',
    end_date: edition?.end_date || '',
    max_participants: edition?.max_participants || '',
    status: edition?.status || 'HIDDEN',
    syllabus_url: edition?.syllabus_url || '',
    recruitment_start_date: toDateTimeLocal(edition?.recruitment_start_date),
    recruitment_end_date: toDateTimeLocal(edition?.recruitment_end_date)
  });

  const fetchEditions = async () => {
    try {
      const res = await fetch('/admin/studies/editions/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEditions(data);
      setError('');
    } catch (err) {
      console.error('Fetch editions error:', err);
      setEditions(sampleEditions);
      setError('Nie udało się załadować ofert z backendu. Widoczne dane testowe.');
    }
  };

  useEffect(() => {
    fetchEditions();
  }, []);

  const resetForm = () => {
    setSelectedEdition(null);
    setFormData(mapEditionToForm(null));
  };

  const startEdit = async (edition) => {
    setSelectedEdition(edition);
    // Fill instantly from row data so edit mode always feels responsive.
    setFormData((prev) => ({
      ...prev,
      ...mapEditionToForm(edition)
    }));

    try {
      const res = await fetch(`/admin/studies/editions/${edition.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        ...mapEditionToForm(data),
        studies_name: data.name || edition.name || prev.studies_name,
        studies_id: prev.studies_id
      }));
    } catch (err) {
      console.error('Fetch edition details error:', err);
    }
  };

  const onDelete = async (edition) => {
    if (!window.confirm(`Czy na pewno usunąć ofertę “${edition.name}”?`)) return;

    try {
      const res = await fetch(`/admin/studies/editions/${edition.id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchEditions();
      if (selectedEdition?.id === edition.id) resetForm();
    } catch (err) {
      console.error('Delete edition error:', err);
      alert('Nie udało się usunąć oferty.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = selectedEdition ? 'PUT' : 'POST';
      const url = selectedEdition
        ? `/admin/studies/editions/${selectedEdition.id}/`
        : '/admin/studies/editions/';

      const payload = {
        ...formData,
        recruitment_start_date: formData.recruitment_start_date,
        recruitment_end_date: formData.recruitment_end_date
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(JSON.stringify(err));
      }

      alert(`Oferta została ${selectedEdition ? 'zaktualizowana' : 'utworzona'}!`);
      resetForm();
      fetchEditions();
    } catch (err) {
      console.error('Submit edition error:', err);
      alert('Wystąpił błąd podczas zapisu oferty.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <h2 className="page-title">Zarządzanie ofertami studiów</h2>

      {error && <div className="error-message">{error}</div>}

      <section className="bg-panel manage-table">
        <h3>Aktualne edycje</h3>
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
                  <button type="button" className="button-secondary" onClick={() => startEdit(edition)}>
                    Edytuj
                  </button>
                  <button type="button" className="button-danger" onClick={() => onDelete(edition)}>
                    Usuń
                  </button>
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

      <section className="bg-panel">
        <h3>{selectedEdition ? 'Edytuj ofertę' : 'Dodaj nową ofertę'}</h3>
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studies_id">ID kierunku studiów *</label>
              <input
                type="number"
                id="studies_id"
                name="studies_id"
                value={formData.studies_id}
                onChange={handleChange}
                required={!selectedEdition}
              />
            </div>

            <div className="form-group">
              <label htmlFor="studies_name">Nazwa kierunku studiów *</label>
              <input
                type="text"
                id="studies_name"
                name="studies_name"
                value={formData.studies_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Cena (PLN) *</label>
              <input
                type="number"
                id="price"
                name="price"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleChange}
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
                value={formData.max_participants}
                onChange={handleChange}
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
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">Data zakończenia studiów *</label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} required>
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
                value={formData.syllabus_url}
                onChange={handleChange}
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
                value={formData.recruitment_start_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="recruitment_end_date">Koniec rekrutacji *</label>
              <input
                type="datetime-local"
                id="recruitment_end_date"
                name="recruitment_end_date"
                value={formData.recruitment_end_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={resetForm} className="button-secondary">
              Anuluj
            </button>
            <button type="submit" disabled={loading} className="button-primary">
              {selectedEdition ? 'Aktualizuj ofertę' : 'Stwórz ofertę'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}