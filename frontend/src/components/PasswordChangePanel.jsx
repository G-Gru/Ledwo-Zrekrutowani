import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { changeUserPassword } from '../services/authService';

export default function PasswordChangePanel({ onPasswordSuccessfullyChanged }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [passwordChangeData, setPasswordChangeData] = useState( {
        oldPassword: "",
        newPassword: "",
        repeatNewPassword: ""
    } )
    const [errors, setErrors] = useState( {} )

    function handleChange(e) {
        const { name, value, type, checked } = e.target;

        setPasswordChangeData(prev => ({
            ...prev,
            [name]: value
        }));

        // czyszczenie errorow
        if (errors[name]) {
            setErrors(prev => {
                const newErrs = {...prev};
                delete newErrs[name];
                return newErrs;
            });
        }
    }
    async function onChangePassword() {

        // validacja danych
        const errors = {}
        let invalid = false
        if (passwordChangeData.oldPassword == "") {
            errors.oldPassword = "Prosze podać swoje stare hasło"
            invalid = true
        }
        if (passwordChangeData.newPassword == "") {
            errors.newPassword = "Prosze podać niepuste nowe hasło" 
            invalid = true
        }
        if (passwordChangeData.repeatNewPassword !== passwordChangeData.newPassword) {
            errors.repeatNewPassword = "Powtórzone hasło nie jest takie same jak piewsze"
            invalid = true;
        }

        // call api do zmiany hasla
        if (!invalid) {
            let apiErrors = await changeUserPassword(passwordChangeData.oldPassword, passwordChangeData.newPassword)
            console.log(apiErrors)
            if (apiErrors.error) errors.server = apiErrors.errorMsg
            else { 
                alert("Pomyślnie zmieniono hasło użytkownika")
                if (onPasswordSuccessfullyChanged) onPasswordSuccessfullyChanged()
            }
        }
        setErrors(errors)
    }

    return (  

        <div className='bg-panel' style={{padding: '20px', margin:'15px'}}>
            <h2 style={{textAlign: 'center', marginBottom: '30px'}}> Zmiana hasła </h2>

            <div className="form-group">
                <label htmlFor="oldPassword">Stare Hasło <span className="required-inline-mark">*</span></label>
                <input className={errors.oldPassword ? 'input-error' : ''} type="password" id="oldPassword" name="oldPassword" onChange={(e) => handleChange(e)} required />

                <label htmlFor="newPassword">Nowe Hasło <span className="required-inline-mark">*</span></label>
                <input className={errors.newPassword ? 'input-error' : ''} type="password" id="newPassword" name="newPassword" onChange={(e) => handleChange(e)} required />

                <label htmlFor="repeatNewPassword">Powtórz Nowe Hasło <span className="required-inline-mark">*</span></label>
                <input className={errors.repeatNewPassword ? 'input-error' : ''} type="password" id="repeatNewPassword" name="repeatNewPassword" onChange={(e) => handleChange(e)} required />
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="error-banner">
                    <span className="material-symbols-outlined">error</span>
                    <div className="error-banner-text">
                        <strong>Znaleziono Błędy:</strong>
                        <ul>
                            {Object.values(errors).map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <button onClick={() => onChangePassword()}> Zmień Hasło </button>
        </div>
  );
}