import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../styles/ApplicationForm.css';
import DocumentUploadCard from '../components/DocumentUploadCard'

export default function ApplicationForm() {
    const [files, setFiles] = useState({
        diploma: null,
        cv: null,
        additional: null
    });

    const handleFileSelect = (id, file) => {
        setFiles(prev => ({ ...prev, [id]: file }));
    };

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

      <div className='page-title'> Wniosek o Rekrutacje na studia podyplomowe </div>

      <div className='bg-panel'>

        <form onSubmit={onSubmit} autoComplete="off">

          {/* DANE OSOBOWE */}
          <div className="section-title">      
            <span class="material-symbols-outlined text-primary">person</span>
            Dane osobowe
          </div>
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

          {/* DANE KONTAKTOWE */}
          <div className="section-title">
            <span class="material-symbols-outlined text-primary">contact_mail</span>
            Dane kontaktowe
            </div>
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

            {/* WYKSZTALCENIE */}
          <div className="section-title">
            <span class="material-symbols-outlined text-primary">school</span>
            Wykształcenie
            </div>
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

            {/* KONTAKT AWARYJNY */}
          <div className="section-title">
            <span class="material-symbols-outlined text-primary">phone</span>
            Kontakt awaryjny
            </div>
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

            {/* DOKUMENTY */}
            <div className="section-title">
            <span class="material-symbols-outlined text-primary">upload_file</span>
                Dokumenty
            </div>
            
            <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>

            <DocumentUploadCard 
                id="diploma"
                title="Dyplom ukończenia studiów"
                formats="PDF, JPG"
                maxSize="5MB"
                icon="description"
                onFileSelect={handleFileSelect}
            />

            <DocumentUploadCard 
                id="cv"
                title="CV"
                formats="PDF"
                maxSize="2MB"
                icon="badge"
                onFileSelect={handleFileSelect}
            />

            <DocumentUploadCard 
                id="additional"
                title="Inne dodatkowe"
                formats="PDF, ZIP"
                maxSize="10MB"
                icon="add_box"
                onFileSelect={handleFileSelect}
            />

            </div>

          <button className='btn-submit' type='submit'>Wyślij wniosek</button>
        </form>
      </div>
    </div>
  );
}