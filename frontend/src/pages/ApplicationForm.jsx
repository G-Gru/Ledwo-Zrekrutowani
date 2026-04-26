import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serverApi } from '../services/serverApi';
import { getAccessToken, isLoggedIn } from '../services/authService';
import '../styles/ApplicationForm.css';
import DocumentUploadCard from '../components/DocumentUploadCard'
import LoginRedirectPage from '../components/LoginRedirectPage';
import DuplicateRecruitmentFormRedirectPage from '../components/DuplicateRecruitmentFormRedirectPage';

export default function ApplicationForm() {
    // Pobieranie danych uzytkownika
    const [isUserLoggedIn, setUserLoggedIn] = useState(false)
    const [userToken, setUserToken] = useState(null)
    const [isUserAlreadyEnrolled, setUserAlreadyEnrolled] = useState(false)

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);

    // dane kierunku i wydzialu
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('edition_id');

    const [courseInfo, setCourseInfo] = useState({ major: "Nieznany kierunek", institute: "Nieznany wydział" })


    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setUserLoggedIn(false);
            return;
        }

        setUserToken(token);
        setUserLoggedIn(true);

        async function fetchUserData() {
            const userData = await serverApi.getUserData(token);

            setFormData(prev => ({
                ...prev,
                firstName: userData.firstName || "logged_account_name",
                lastName: userData.lastName || "logged_account_surname",
                email: userData.email || "logged_account_email@mail.com"
            }));
        }

        async function checkUserAlreadyEnrolled() {
            const otherEnrollmentData = await serverApi.getUserActiveApplications(token)

            if (otherEnrollmentData && Array.isArray(otherEnrollmentData.applications)) {
                const alreadyEnrolled = otherEnrollmentData.applications.some(application => {
                    const editionId = application?.studies_edition?.id ?? application?.studies_edition;
                    return String(editionId) === String(courseId);
                });
                setUserAlreadyEnrolled(alreadyEnrolled);
            }
        }

        fetchUserData();
        checkUserAlreadyEnrolled()

        const watchInterval = setInterval(() => {
            if (!isLoggedIn()) {
                setUserLoggedIn(false);
            }
        }, 30000);

        return () => clearInterval(watchInterval);
    }, [courseId]);

    useEffect(() => {
        const fetchCourseData = async () => {
            if (userToken && courseId) {
                const info = await serverApi.getCourseInfo(courseId, userToken);
                setCourseInfo(info);
            }
        };
        fetchCourseData();
    }, [courseId, userToken]);

    // info nieobowiazkowe
    const [hasCorrespondenceAddress, setHasCorrespondenceAddress] = useState(false);
    const [hasEmergencyContact, setHasEmergencyContact] = useState(false);

    // dokumenty
    const [files, setFiles] = useState({ diploma: null, cv: null, additional: null });
    const handleFileSelect = (id, file) => {
        setFiles(prev => ({ ...prev, [id]: file }));
    };
    const handleFileRemove = (id) => {
        setFiles(prev => ({ ...prev, [id]: null }));
    };

    // dane formularza
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", // Pobierane z konta
        title: "", familyName: "", birthdate: "", birthplace: "", pesel: "", nationality: "Polska",
        residenceAddress: { street: "", house: "", apartment: "", city: "", country: "Polska", postalCode: "" },
        correspondenceAddress: { street: "", house: "", apartment: "", city: "", country: "Polska", postalCode: "" },
        phone: "",
        studiesName: "", studiesLocation: "", studiesEndYear: 2024, highSchoolLocation: "Polska",
        emergencyContact: { name: "", surname: "", phone: "" },
        consents: { data: false, rules: false, rodo: false }
    });
    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: { ...prev[section], [name]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }

        // czyszczenie errorow
        if (errors[e.target.name]) {
            setErrors(prev => {
                const newErrs = {...prev};
                delete newErrs[e.target.name];
                return newErrs;
            });
        }
    };

    // wysylanie formularza
    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Reset error
        if (isUserAlreadyEnrolled) {
            setError('Jesteś już zapisany na ten sam kierunek. Nie możesz wysłać kolejnego wniosku.');
            return;
        }
        if (validate()) {
            console.log("Próba Wysyłania formularza...", formData, " z załącznikami: ", files);
            const result = await serverApi.sendApplicationForm(userToken, {
                formData,
                files,
                studies_edition_id: courseId,
                action: "ENROLL",
            });

            if (result && !result.error) {
                navigate(`/applicationSent?edition_id=${courseId}`);
            } else {
                const message = result ? (result.errorDetail || result.errorMsg || 'Błąd komunikacji z serwerem') : 'Błąd komunikacji z serwerem';
                setError(`Błąd przy wysyłaniu wniosku: ${message}`);
            }
        }
    };
    const validate = () => {
        /* DEBUG TEMORATRY !!!!!!!!!!!  */ return true;

        let newErrors = {};

        // Sprawdzenie wymaganych plików
        if (!files.diploma) newErrors.diploma = "Dyplom jest wymagany.";

        // Podstawowe pola
        if (!/^\d{11}$/.test(formData.pesel)) newErrors.pesel = "PESEL musi mieć 11 cyfr.";
        if (formData.phone.length < 9) newErrors.phone = "Numer telefonu jest za krótki.";
        
        // Adres zamieszkania
        if (!/^\d{2}-\d{3}$/.test(formData.residenceAddress.postalCode)) {
            newErrors.residenceAddress_postalCode = "Błędny kod pocztowy.";
        }

        // Adres korespondencyjny (tylko jeśli checkbox jest zaznaczony)
        if (hasCorrespondenceAddress && !/^\d{2}-\d{3}$/.test(formData.correspondenceAddress.postalCode)) {
            newErrors.correspondenceAddress_postalCode = "Błędny kod pocztowy.";
        }

        // Zgody
        if (!formData.consents.rules) newErrors.rules = "Musisz zaakceptować regulamin.";
        if (!formData.consents.rodo) newErrors.rodo = "Zgoda RODO jest wymagana.";

        setErrors(newErrors);
        
        // Jeśli obiekt newErrors jest pusty, zwraca true (formularz ok)
        return Object.keys(newErrors).length === 0;
    }
  
  return (
    <div>
    { !isUserLoggedIn ? <LoginRedirectPage /> 
    : isUserAlreadyEnrolled ? <DuplicateRecruitmentFormRedirectPage /> 
    : (
        <div className='page-layout'>

            {/* Tytul strony */}
            <div className='page-title'> Wniosek o Rekrutacje na studia podyplomowe </div>
            <div className="course-info">
                <p><strong>KIERUNEK:</strong> {courseInfo.name.toUpperCase()}</p>
                {/* <p><strong>WYDZIAŁ:</strong> {courseInfo.institute.toUpperCase()}</p> */}
            </div>

        <div className='bg-panel'>
            <form onSubmit={onSubmit} autoComplete="off">
                {isUserAlreadyEnrolled && (
                    <div className="error-banner">
                        <span className="material-symbols-outlined">error</span>
                        <div className="error-banner-text">
                            <strong>Już uczestniczysz w rekrutacji do tego kierunku.</strong>
                            <p>Nie możesz wysłać kolejnego wniosku dla tego samego wydania studiów.</p>
                        </div>
                    </div>
                )}

            {/* DANE OSOBOWE */}
            <div className="section-title">      
            <span className="material-symbols-outlined text-primary">person</span>
            Dane osobowe
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="firstName">Imię</label>
                    <input disabled className="input-readonly" id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} /*required*/ />

                    <label htmlFor="lastName">Nazwisko</label>
                    <input disabled className="input-readonly" id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} /*required*/ />

                    <label htmlFor="title">Tytuł</label>
                    <select name="title" value={formData.title} onChange={handleChange}>
                        <option value="">Wybierz...</option>
                        <option value="lic">Licencjat</option>
                        <option value="inz">Inżynier</option>
                        <option value="mgr">Magister</option>
                        <option value="mgr_inz">Magister Inżynier</option>
                        <option value="dr">Doktor</option>
                    </select>

                    <label htmlFor="familyName">Nazwisko rodowe</label>
                    <input id="familyName" name="familyName" autoComplete="additional-name" value={formData.familyName} onChange={handleChange} />
                </div>

                <div className="form-group">
                    <label htmlFor="birthdate">Data urodzenia</label>
                    <input id="birthdate" name="birthdate" type="date" autoComplete="bday" value={formData.birthdate} onChange={handleChange} /*required*/ />

                    <label htmlFor="birthplace">Miejsce urodzenia</label>
                    <input id="birthplace" name="birthplace" autoComplete="birthplace" value={formData.birthplace} onChange={handleChange} />

                    <label htmlFor="pesel">PESEL</label>
                    <input id="pesel" className={errors.pesel ? 'input-error' : ''} name="pesel" maxLength="11" autoComplete="off" value={formData.pesel} onChange={handleChange} /*required*/ />

                    <label htmlFor="nationality">Obywatelstwo</label>
                    <input id="nationality" name="nationality" autoComplete="nationality" value={formData.nationality} onChange={handleChange} /*required*/ />
                </div>
            </div>

            {/* DANE KONTAKTOWE */}
            <div className="section-title">
                <span className="material-symbols-outlined text-primary">contact_mail</span>
                Dane kontaktowe
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input disabled id="email" className="input-readonly" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} /*required*/ />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Telefon</label>
                    <input id="phone" className={errors.phone ? 'input-error' : ''} name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} /*required*/ />
                </div>
            </div>

            {/* Dane adresowe */}
            <div className="section-title">
                <span className="material-symbols-outlined text-primary">home</span>
                Dane adresowe
            </div>  

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="address-street">Ulica </label>
                    <input id="address-street" name="street" autoComplete="address-street" value={formData.residenceAddress.street} onChange={(e) => handleChange(e, 'residenceAddress')} /*required*/ />

                    <label htmlFor="address-homeNum">Numer domu</label>
                    <input id="address-homeNum" name="house" autoComplete="address-homeNum" value={formData.residenceAddress.house} onChange= {(e) => handleChange(e, 'residenceAddress')} /*required*/ />

                    <label htmlFor="address-zip">Kod pocztowy</label>
                    <input id="address-zip" className={errors.residenceAddress_postalCode ? 'input-error' : ''} name="postalCode" autoComplete="address-zip" value={formData.residenceAddress.postalCode} onChange={(e) => handleChange(e, 'residenceAddress')} /*required*/ />
                </div>
                <div className="form-group">
                    <label htmlFor="address-city">Miasto</label>
                    <input id="address-city" name="city" autoComplete="address-city" value={formData.residenceAddress.city} onChange={(e) => handleChange(e, 'residenceAddress')} /*required*/ />

                    <label htmlFor="address-apartNum">Numer mieszkania</label>
                    <input id="address-apartNum" name="apartment" autoComplete="address-apartNum" value={formData.residenceAddress.apartment} onChange={(e) => handleChange(e, 'residenceAddress')} />

                    <label htmlFor="address-country">Kraj</label>
                    <input id="address-country" name="country" autoComplete="address-country" value={formData.residenceAddress.country} onChange={(e) => handleChange(e, 'residenceAddress')} /*required*/ />
                </div>
            </div>

            <label className="checkbox-container">
                <input type="checkbox" checked={hasCorrespondenceAddress} onChange={(e) => setHasCorrespondenceAddress(e.target.checked)} />
                Adres korespondencyjny jest inny niż zamieszkania
            </label>


            { hasCorrespondenceAddress && ( <div>
                <div className="section-title"> Adres korespondencyjny </div>
                <div className="form-row">
                    <div className="form-group">

                        <label htmlFor="correspondence-street">Ulica </label>
                        <input id="correspondence-street" name="street" autoComplete="correspondence-street" value={formData.correspondenceAddress.street} onChange={(e) => handleChange(e, 'correspondenceAddress')} /*required*/ />

                        <label htmlFor="correspondence-homeNum">Numer domu</label>
                        <input id="correspondence-homeNum" name="house" autoComplete="correspondence-homeNum" value={formData.correspondenceAddress.house} onChange={(e) => handleChange(e, 'correspondenceAddress')} /*required*/ />

                        <label htmlFor="correspondence-zip">Kod pocztowy</label>
                        <input id="correspondence-zip" className={errors.correspondenceAddress_postalCode ? 'input-error' : ''} name="postalCode" autoComplete="correspondence-zip" value={formData.correspondenceAddress.postalCode} onChange={(e) => handleChange(e, 'correspondenceAddress')} /*required*/ />
                    </div>
                    <div className="form-group">
                        <label htmlFor="correspondence-city">Miasto</label>
                        <input id="correspondence-city" name="city" autoComplete="correspondence-city" value={formData.correspondenceAddress.city} onChange={(e) => handleChange(e, 'correspondenceAddress')} /*required*/ />

                        <label htmlFor="correspondence-apartNum">Numer mieszkania</label>
                        <input id="correspondence-apartNum" name="apartment" autoComplete="correspondence-apartNum" value={formData.correspondenceAddress.apartment} onChange={(e) => handleChange(e, 'correspondenceAddress')} />

                        <label htmlFor="correspondence-country">Kraj</label>
                        <input id="correspondence-country" name="country" autoComplete="correspondence-country" value={formData.correspondenceAddress.country} onChange={(e) => handleChange(e, 'correspondenceAddress')} /*required*/ />
                    </div>
                </div>
            </div> )}

                {/* WYKSZTALCENIE */}
                <div className="section-title">
                    <span className="material-symbols-outlined text-primary">school</span>
                    Wykształcenie
                    </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="studiesName">Nazwa uczeli wyższej</label>
                        <input id="studiesName" name="studiesName" autoComplete="studiesName" value={formData.studiesName} onChange={handleChange} />
                        
                        <label htmlFor="studiesLocation">Lokalizacja</label>
                        <input id="studiesLocation" name="studiesLocation" autoComplete="off" value={formData.studiesLocation} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studiesEndYear">Rok zakończenia</label>
                        <input id="studiesEndYear" name="studiesEndYear" type="number" min="1900" max="2100" autoComplete="off" value={formData.studiesEndYear} onChange={handleChange} />

                        <label>Miejsce uzyskania świadectwa dojrzałości *</label>
                        <select className="radio-group">
                            <option> Polska </option>
                            <option> Inne </option>
                        </select>
                    </div>
                </div>
                <small className="hint-text">* dane pobierane tylko dla celów statystycznych</small>

                {/* KONTAKT AWARYJNY */}
                <div className="section-title">
                    <span className="material-symbols-outlined text-primary">phone</span>
                    Kontakt awaryjny
                </div>

                <label className="checkbox-container">
                    <input type="checkbox" onChange={(e) => setHasEmergencyContact(e.target.checked)} />
                    Chcę dodać kontakt awaryjny
                </label>

                <div className="form-row">
                    {hasEmergencyContact && (
                        <><div className="form-group">
                            <label htmlFor="emergencyContactName">Imię kontaktu</label>
                            <input id="emergencyContactName" name="name" autoComplete="name" value={formData.emergencyContact.name} onChange={(e) => handleChange(e, 'emergencyContact') } />

                            <label htmlFor="emergencyContactContact">Telefon kontaktu awaryjnego</label>
                            <input id="emergencyContactContact" name="phone" type="tel" autoComplete="tel" value={formData.emergencyContact.phone} onChange={(e) => handleChange(e, 'emergencyContact') } />
                        </div>
                        <div className="form-group">
                            <label htmlFor="emergencyContactSurname">Nazwisko kontaktu</label>
                            <input id="emergencyContactSurname" name="surname" autoComplete="family-name" value={formData.emergencyContact.surname} onChange={(e) => handleChange(e, 'emergencyContact') } />
                        </div></>
                    )}
                </div>

                {/* DOKUMENTY */}
                <div className="section-title">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                    Dokumenty
                </div>
                
                <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <DocumentUploadCard 
                        id="diploma"
                        title="Dyplom ukończenia studiów wyższych"
                        formats="PDF, JPG"
                        maxSize="5MB"
                        icon="description"
                        onFileSelect={handleFileSelect}
                        onFileRemove={handleFileRemove}
                    />
                </div>
                
                {/* Zgody i regulamin */}
                <div className="section-title">Zgody i regulaminy</div>
                <div className="consent-box">
                    <label className="consent-item">
                    <input
                        type="checkbox"
                        name="data"
                        checked={formData.consents.data}
                        onChange={(e) => handleChange(e, 'consents')}
                    />
                    Potwierdzam, że wszytkie podane powyżej dane są zgodne z prawdą w momencie wypełnienia.
                    </label>

                    <label className="consent-item">
                    <input
                        type="checkbox"
                        name="rules"
                        checked={formData.consents.rules}
                        onChange={(e) => handleChange(e, 'consents')}
                    />
                    Potwierdzam, że zapoznałem się z treścia i zobowiązuję się przestrzegać regulaminu studiów AGH, 
                    <a className='inline-link' href ='/assets/dokumenty/regulamin-studiow-podyplomowych-agh.pdf' target="_blank">Link do pełnego dokumetnu.
                    <span className="material-symbols-outlined">open_in_new</span></a>
                    
                    </label>

                    <label className="consent-item">
                    <input
                        type="checkbox"
                        name="rodo"
                        checked={formData.consents.rodo}
                        onChange={(e) => handleChange(e, 'consents')}
                    />
                    Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych) [Dz. U. UE.L.2016.119.1 z dnia 4 maja 2016 r.], zwanego dalej RODO, wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji na powyższe studia i dokumentowanie ich przebiegu.
                    <a className='inline-link' href = '/assets/dokumenty/zgoda_na_przetwarzanie_danych_osobowych.pdf' target="_blank">Link do pełnego dokumetnu. 
                    <span className="material-symbols-outlined">open_in_new</span></a>
                    </label>
                </div> 
            
            {/* Komunikat o błędach zbiorczy */}
            {Object.keys(errors).length > 0 && (
                <div className="error-banner">
                    <span className="material-symbols-outlined">error</span>
                    <div className="error-banner-text">
                        <strong>Formularz zawiera błędy:</strong>
                        <ul>
                            {Object.values(errors).map((err, index) => (
                                <li key={index}>{err}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* error msg */}
            {error && <div className="error-message">{error}</div>}

            {/* Wyslij formularz guzik */}
            <button className='btn-submit' type='submit' disabled={isUserAlreadyEnrolled}>Wyślij wniosek</button>

            </form>
        </div>
        </div>
    ) }
    </div>
  )
}