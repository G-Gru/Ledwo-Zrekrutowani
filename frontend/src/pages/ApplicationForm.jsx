import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/Style.css';

export default function ApplicationForm() {

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        title: "",
        familiyName: "",
        birthdate: "",
        birthplace: "",
        pesel: "",
        nationality: "",
        address: "",
        corespondenceAddress: "",
        email: "",
        phone: "",
        studiesPlace: "",
        studiesEndYear: "",
        studiesPlace: "",
        emergencyContactName: "",
        emergencyContactSurname: "",
        emergencyContactContact: "",
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
        setConsents((prev) => ({ ...prev, [name]: checked }));
        } else {
        setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
    }
  
  return (
    <div className='page-layout'>

      <h2 className='page-title'> Wniosek o Rekrutacje na studia podyplomowe </h2>

      <div className='bg-panel'>

        <form onSubmit={onSubmit} autoComplete="off">

          <div className="section-title">Dane osobowe</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">Imię</label>
              <input id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} required />

              <label htmlFor="lastName">Nazwisko</label>
              <input id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} required />

              <label htmlFor="title">Tytuł</label>
              <input id="title" name="title" autoComplete="honorific-prefix" placeholder="np. Inżynier" value={formData.title} onChange={handleChange} />

              <label htmlFor="familiyName">Nazwisko rodowe</label>
              <input id="familiyName" name="familiyName" autoComplete="additional-name" value={formData.familiyName} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="birthdate">Data urodzenia</label>
              <input id="birthdate" name="birthdate" type="date" autoComplete="bday" value={formData.birthdate} onChange={handleChange} required />

              <label htmlFor="birthplace">Miejsce urodzenia</label>
              <input id="birthplace" name="birthplace" autoComplete="birthplace" value={formData.birthplace} onChange={handleChange} />

              <label htmlFor="pesel">PESEL</label>
              <input id="pesel" name="pesel" maxLength="11" autoComplete="off" value={formData.pesel} onChange={handleChange} required />

              <label htmlFor="nationality">Obywatelstwo</label>
              <input id="nationality" name="nationality" autoComplete="nationality" value={formData.nationality} onChange={handleChange} required />
            </div>
          </div>

          <div className="section-title">Dane kontaktowe</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address">Adres zamieszkania</label>
              <input id="address" name="address" autoComplete="street-address" value={formData.address} onChange={handleChange} required />

              <label htmlFor="corespondenceAddress">Adres korespondencyjny</label>
              <input id="corespondenceAddress" name="corespondenceAddress" autoComplete="street-address" placeholder="zostaw puste jeśli taki sam jak adres zamieszkania" value={formData.corespondenceAddress} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} required />

              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} required />
            </div>
          </div>

          <div className="section-title">Wykształcenie</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studiesPlace">Miejsce studiów</label>
              <input id="studiesPlace" name="studiesPlace" autoComplete="organization" value={formData.studiesPlace} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="studiesEndYear">Rok zakończenia</label>
              <input id="studiesEndYear" name="studiesEndYear" type="number" min="1900" max="2100" autoComplete="off" value={formData.studiesEndYear} onChange={handleChange} />
            </div>
          </div>

          <div className="section-title">Kontakt awaryjny</div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emergencyContactName">Imię kontaktu</label>
              <input id="emergencyContactName" name="emergencyContactName" autoComplete="name" value={formData.emergencyContactName} onChange={handleChange} />

              <label htmlFor="emergencyContactSurname">Nazwisko kontaktu</label>
              <input id="emergencyContactSurname" name="emergencyContactSurname" autoComplete="family-name" value={formData.emergencyContactSurname} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="emergencyContactContact">Telefon kontaktu awaryjnego</label>
              <input id="emergencyContactContact" name="emergencyContactContact" type="tel" autoComplete="tel" value={formData.emergencyContactContact} onChange={handleChange} />
            </div>
          </div>

          <div className="section-title">Dokumenty</div>

          <button className='btn-submit' type='submit'>Wyślij wniosek</button>
        </form>
      </div>
    </div>
  );
}