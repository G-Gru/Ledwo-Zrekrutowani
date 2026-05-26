import React, { useEffect, useState } from 'react';
import AccountPageLeftMenu from '../../components/AccountPageLeftMenu';
import { getAccessToken, register } from '../../services/authService';
import { serverApi } from '../../services/serverApi';
import '../../styles/Style.css';

export default function ManageEmployeesAccounts() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    updates: false,
  });

  const token = getAccessToken();

  const fetchEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await serverApi.apiRequest('/api/admin/users/employees/', 'GET', null, token, true, false, true);
      if (res.error) {
        setError(res.errorMsg || 'Błąd podczas pobierania pracowników.');
        setEmployees([]);
      } else {
        setEmployees(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(err);
      setError('Nieoczekiwany błąd przy pobieraniu pracowników.');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // basic validation
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.password) {
      setError('Uzupełnij wszystkie wymagane pola.');
      return;
    }

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        updates: Boolean(form.updates),
      };

      const response = await register(payload);

      // register throws on error via apiClient, so success means we got a response object
      alert('Konto pracownika zostało utworzone.');
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', updates: false });
      fetchEmployees();
    } catch (err) {
      console.error('Register error', err);
      setError(err.message || 'Błąd podczas tworzenia konta.');
    }
  };

  return (
    <div className='account-page-layout'>
      <AccountPageLeftMenu />

      <div className='account-column' id='account-page-column-middle'>
        <h2 className='page-title'>Zarządzanie pracownikami</h2>

        <section className='bg-panel'>
          <h3>Dodaj nowe konto pracownicze</h3>
          <form onSubmit={handleSubmit} className='form-container'>
            <div className='form-row'>
              <div className='form-group'>
                <label>Imię *</label>
                <input name='first_name' value={form.first_name} onChange={handleChange} required />
              </div>

              <div className='form-group'>
                <label>Nazwisko *</label>
                <input name='last_name' value={form.last_name} onChange={handleChange} required />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label>Email służbowy *</label>
                <input name='email' type='email' value={form.email} onChange={handleChange} required />
              </div>

              <div className='form-group'>
                <label>Telefon służbowy *</label>
                <input name='phone' value={form.phone} onChange={handleChange} required />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label>Hasło *</label>
                <input name='password' type='password' value={form.password} onChange={handleChange} required />
              </div>

              <div className='form-group'>
                <label>Zgoda na aktualizacje</label>
                <input name='updates' type='checkbox' checked={form.updates} onChange={handleChange} />
              </div>
            </div>

            <div className='form-actions'>
              <button type='submit' className='button-primary'>Utwórz konto</button>
              <button type='button' className='button-secondary' onClick={() => setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', updates: false })}>Wyczyść</button>
            </div>
            {error && <div className='error-message' style={{ marginTop: '0.5rem' }}>{error}</div>}
          </form>
        </section>

        <section className='bg-panel manage-table' style={{ marginTop: '1rem' }}>
          <h3>Lista pracowników</h3>
          {loading ? (
            <p>Ładowanie...</p>
          ) : (
            <table className='styled-table'>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Imię</th>
                  <th>Nazwisko</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Tytuł</th>
                  <th>Work phones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    <td>{emp.first_name || '-'}</td>
                    <td>{emp.last_name || '-'}</td>
                    <td>{emp.email || '-'}</td>
                    <td>{emp.phone || '-'}</td>
                    <td>{emp.academic_title || '-'}</td>
                    <td>{Array.isArray(emp.work_phones) ? emp.work_phones.map(w => w.phone).join(', ') : '-'}</td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr><td colSpan='7'>Brak pracowników do wyświetlenia.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}
