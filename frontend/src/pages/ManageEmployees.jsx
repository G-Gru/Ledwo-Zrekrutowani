import React, { useEffect, useState } from 'react';
import '../styles/Style.css';
import '../styles/ManageEmployees.css';
import AccountPageLeftMenu from '../components/AccountPageLeftMenu';
import { register, getAccessToken } from '../services/authService';
import { serverApi } from '../services/serverApi';

export default function ManageEmployees() {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [automaticEmail, setAutomaticEmail] = useState(true)

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
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
    }, []);

    function generateRandomString(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
    }


    const generateEmployeeEmail = (name, surname) => {
        if (name === "" || surname === "") return ""
        return `${name}.${surname}@employee.agh.edu.pl`
    }
    const generateEmployeeOneTimePassword = (surname) => {
        if (surname === "") return ""
        return `${surname}-${generateRandomString(6)}`
    }

    const handleChange = (e) => {
        setError("")
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));

        /* funkcja trim() do uzuwania bialych znakow */
        if(typeof(String.prototype.trim) === "undefined")
        {
            String.prototype.trim = function() 
            {
                return String(this).replace(/^\s+|\s+$/g, '');
            };
        }

        /* automatyczna generacja hasla i emailu */
        let first_name = (name === "first_name" ? value : form.first_name).trim().toLowerCase()
        let last_name = (name === "last_name" ? value : form.last_name).trim().toLowerCase()
        if (automaticEmail) {
            setForm(prev => ({...prev, 
                email: generateEmployeeEmail(first_name, last_name),
                password: generateEmployeeOneTimePassword(last_name)
            }) )
        } else {
            setForm(prev => ({...prev, 
                password: generateEmployeeOneTimePassword(last_name)
            }) )
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // basic validation
        if (!form.first_name || !form.last_name || !form.email || !form.password) {
            setError('Uzupełnij wszystkie wymagane pola.');
            return;
        }

        try {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                email: form.email,
                phone: "",
                password: form.password,    
                updates: false,
            };

            const response = await register(payload);

            alert(`Konto pracownika zostało utworzone. \n EMAIL: ${form.email} \n HASLO: ${form.password}`);
            alert("UWAGA Utworzone konto nie jest pracownicze tylko zwykle (na razie nie ma endpointu) ")
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

        <div className='account-column' id="employee-manage-column">
            <h2 className='page-title'>Zarządzanie pracownikami</h2>

            <div className='bg-panel'>
                <h3 style={{textAlign:'center', margin:'1rem'}}>Dodaj nowe konto pracownicze</h3>
                
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
                            { automaticEmail ? 
                                <input disabled className='auto-input-field' name='email' type='email' value={form.email} onChange={handleChange} required />
                                : <input name='email' type='email' value={form.email} onChange={handleChange} required />
                            }
                        </div>

                        <div className='form-group'>
                            <label>Hasło *</label>
                            <input disabled className='auto-input-field'  name='password' value={form.password} onChange={handleChange} required />
                        </div>
                    </div>

                    <label> Ustaw automatyczny email </label>
                    <input type="checkbox" checked={automaticEmail} onChange={(e) => {setAutomaticEmail(!automaticEmail)} } />

                    <div className='form-actions'>
                    <button type='submit' className='button-primary'>Utwórz konto</button>
                    <button type='button' className='button-secondary' onClick={() => setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', updates: false })}>Wyczyść</button>
                    </div>
                    {error && <div className='error-message' style={{ marginTop: '0.5rem' }}>{error}</div>}
                </form>
            </div>

            <div className='bg-panel manage-table' style={{ marginTop: '1rem' }}>
            <h3 style={{textAlign:'center', margin:'1rem'}}> Lista pracowników </h3>
            {loading ? (
                <p>Ładowanie...</p>
            ) : (
                <table className='styled-table employee-table'>
                <thead>
                    <tr>
                    <th>ID</th>
                    <th>Imię</th>
                    <th>Nazwisko</th>
                    <th>Email</th>
                    <th>Tytuł</th>
                    <th>Telefon(y)</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map(emp => (
                    <tr key={emp.id}>
                        <td>{emp.id}</td>
                        <td>{emp.first_name || '-'}</td>
                        <td>{emp.last_name || '-'}</td>
                        <td>{emp.email || '-'}</td>
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
            </div>
        </div>
        </div>
    );
}