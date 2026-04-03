import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';

export default function PublishStudiesOffer() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/admin/studies/editions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Oferta studiów została opublikowana!');
        navigate('/studies');
      } else {
        const error = await response.json();
        alert(`Błąd: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error publishing offer:', error);
      alert('Wystąpił błąd podczas publikowania oferty.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-layout">
      <h2 className="page-title">Publikacja oferty studiów</h2>

      <div className="bg-panel">
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studies_id">ID Kierunku studiów *</label>
              <input
                type="number"
                id="studies_id"
                name="studies_id"
                placeholder="Wpisz ID kierunku"
                value={formData.studies_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="studies_name">Nazwa kierunku studiów</label>
              <input
                type="text"
                id="studies_name"
                name="studies_name"
                placeholder="Nazwa kierunku"
                value={formData.studies_name}
                onChange={handleChange}
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
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
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
            <button type="button" onClick={() => navigate('/')} className="button-secondary">
              Anuluj
            </button>
            <button type="submit" disabled={loading} className="button-primary">
              {loading ? 'Publikowanie...' : 'Opublikuj ofertę'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}