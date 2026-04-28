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
    const [enrollmentId, setEnrollmentId] = useState(null)

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);

    // dane kierunku i wydzialu
    const [searchParams] = useSearchParams();
    const courseId = searchParams.get('edition_id');

    const [courseInfo, setCourseInfo] = useState({ name: "Nieznany kierunek" })
    const [formData, setFormData] = useState({
        firstName: "", secondName: "", lastName: "", email: "",
        title: "", familyName: "", birthdate: "", birthplace: "", pesel: "", citizenship: "Polska",
        residenceAddress: { street: "", house: "", apartment: "", city: "", country: "Polska", postalCode: "" },
        correspondenceAddress: { street: "", house: "", apartment: "", city: "", country: "Polska", postalCode: "" },
        phone: "",
        educationUniversity: "", educationLocation: "", educationYear: "", maturity_country: "Polska",
        emergencyName: "", emergencyLastName: "", emergencyPhone: "",
        consents: { data: false, rules: false, rodo: false }
    });

    // info nieobowiazkowe
    const [hasCorrespondenceAddress, setHasCorrespondenceAddress] = useState(false);
    const [hasEmergencyContact, setHasEmergencyContact] = useState(false);

    // dokumenty
    const [documents, setDocuments] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState({});
    const [files, setFiles] = useState({});

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setUserLoggedIn(false);
            return;
        }

        setUserToken(token);
        setUserLoggedIn(true);

        async function bootstrapForm() {
            const userData = await serverApi.getUserData(token);

            let mergedFormData = {
                firstName: userData.firstName || "logged_account_name",
                lastName: userData.lastName || "logged_account_surname",
                email: userData.email || "logged_account_email@mail.com"
            };


            const existingApplication = await serverApi.getExistingApplicationForm(token, courseId);
            if (!existingApplication.error && existingApplication.data) {
                setEnrollmentId(existingApplication.data.enrollment)

                const mappedExistingData = await serverApi.mapExistingApplicationToFormData(
                    token,
                    existingApplication.data
                );

                mergedFormData = {
                    ...mergedFormData,
                    ...mappedExistingData
                };

                const hasDifferentCorrespondence =
                    existingApplication.data.registered_address &&
                    existingApplication.data.residential_address &&
                    String(existingApplication.data.registered_address) !== String(existingApplication.data.residential_address);
                setHasCorrespondenceAddress(hasDifferentCorrespondence);


                const hasEmergency =
                    !!mappedExistingData.emergencyName ||
                    !!mappedExistingData.emergencyLastName ||
                    !!mappedExistingData.emergencyPhone;
                setHasEmergencyContact(hasEmergency);
            }

            if (existingApplication.data?.enrollment) {
                const docsRes = await serverApi.getEnrollmentDocuments(
                    token,
                    existingApplication.data.enrollment
                );

                if (!docsRes.error && Array.isArray(docsRes.data)) {
                    const mapped = {};

                    docsRes.data.forEach(doc => {
                        mapped[doc.studies_document.id] = doc;
                    });

                    setExistingDocuments(mapped);
                    console.log(mapped)
                }
            }

            setFormData(prev => ({
                ...prev,
                ...mergedFormData
            }));


            const otherEnrollmentData = await serverApi.getUserActiveApplications(token);
            if (otherEnrollmentData && Array.isArray(otherEnrollmentData.applications)) {
                const alreadyEnrolled = otherEnrollmentData.applications.some(application => {
                    const editionId = application?.studies_edition?.id ?? application?.studies_edition;
                    const statusCode = application?.status?.[0];

                    return String(editionId) === String(courseId) && String(statusCode) !== "DRAFT";
                });

                setUserAlreadyEnrolled(alreadyEnrolled);
            }

            const docsResult = await serverApi.getStudiesEditionDocuments(token, courseId);
            if (!docsResult.error && Array.isArray(docsResult.data)) {
                const uploadableDocs = docsResult.data.filter(doc => !doc.is_read_only);
                setDocuments(uploadableDocs);
            }
        }

        bootstrapForm();

        const watchInterval = setInterval(() => {
            if (!isLoggedIn()) {
                setUserLoggedIn(false);
            }
        }, 30000);

        return () => clearInterval(watchInterval);
    }, [courseId, enrollmentId]);

    useEffect(() => {
        const fetchCourseData = async () => {
            if (userToken && courseId) {
                const info = await serverApi.getCourseInfo(courseId, userToken);
                setCourseInfo(info);
            }
        };
        fetchCourseData();
    }, [courseId, userToken]);


    const handleFileSelect = (id, file) => {
        setFiles(prev => ({ ...prev, [id]: file }));
    };
    const handleFileRemove = (id) => {
        setFiles(prev => ({ ...prev, [id]: null }));
    };

    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [name]: newValue
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: newValue
            }));
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
    const submitApplication = async (actionType) => {
        setError(null);

        if (actionType === "ENROLL" && isUserAlreadyEnrolled) {
            setError('Jesteś już zapisany na ten sam kierunek. Nie możesz wysłać kolejnego wniosku.');
            return;
        }

        if (!validate(actionType)) {
            return;
        }

        console.log(`Próba wysłania formularza z akcją ${actionType}`, formData, files);

        const result = await serverApi.sendApplicationForm(userToken, {
            formData,
            files,
            studies_edition_id: courseId,
            action: actionType,
        }, enrollmentId === null);

        if (result && !result.error) {
            setEnrollmentId(result.data.enrollment)
            if (actionType === "ENROLL") {
                navigate(`/applicationSent?edition_id=${courseId}`);
            }
        } else {
            const message = result
                ? (result.errorDetail || result.errorMsg || 'Błąd komunikacji z serwerem')
                : 'Błąd komunikacji z serwerem';

            setError(`Błąd przy wysyłaniu formularza: ${message}`);
        }
    };


    const validate = (actionType = "ENROLL") => {
        let newErrors = {};

        const isFinalSubmit = actionType === "ENROLL";

        // Docs
        if (isFinalSubmit) {
            documents.forEach(doc => {
                const hasNewFile = !!files[doc.id];
                const hasExistingFile = !!existingDocuments?.[doc.id];

                if (doc.required && !hasNewFile && !hasExistingFile) {
                    newErrors[`doc_${doc.id}`] = `${doc.name} jest wymagany.`;
                }
            });
        }

        // pesel
        if (isFinalSubmit) {
            if (!/^\d{11}$/.test(formData.pesel)) {
                newErrors.pesel = "PESEL musi mieć 11 cyfr.";
            }
        } else {
            if (formData.pesel && !/^\d{11}$/.test(formData.pesel)) {
                newErrors.pesel = "PESEL musi mieć 11 cyfr.";
            }
        }

        // phone
        if (isFinalSubmit) {
            if (!formData.phone || formData.phone.length < 9) {
                newErrors.phone = "Numer telefonu jest za krótki.";
            }
        } else {
            if (formData.phone && formData.phone.length < 9) {
                newErrors.phone = "Numer telefonu jest za krótki.";
            }
        }

        // postal
        if (isFinalSubmit) {
            if (!/^\d{2}-\d{3}$/.test(formData.residenceAddress.postalCode)) {
                newErrors.residenceAddress_postalCode = "Błędny kod pocztowy.";
            }
        } else {
            if (
                formData.residenceAddress.postalCode &&
                !/^\d{2}-\d{3}$/.test(formData.residenceAddress.postalCode)
            ) {
                newErrors.residenceAddress_postalCode = "Błędny kod pocztowy.";
            }
        }

        // addreses
        if (hasCorrespondenceAddress) {
            if (isFinalSubmit) {
                if (!/^\d{2}-\d{3}$/.test(formData.correspondenceAddress.postalCode)) {
                    newErrors.correspondenceAddress_postalCode = "Błędny kod pocztowy.";
                }
            } else {
                if (
                    formData.correspondenceAddress.postalCode &&
                    !/^\d{2}-\d{3}$/.test(formData.correspondenceAddress.postalCode)
                ) {
                    newErrors.correspondenceAddress_postalCode = "Błędny kod pocztowy.";
                }
            }
        }

        // checkboxes
        if (isFinalSubmit) {
            if (!formData.consents.data) newErrors.rules = "Musisz potwierdzić poprawność danych.";
            if (!formData.consents.rules) newErrors.rules = "Musisz zaakceptować regulamin.";
            if (!formData.consents.rodo) newErrors.rodo = "Zgoda RODO jest wymagana.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
  
  return (
    <div>
    { !isUserLoggedIn ? <LoginRedirectPage /> 
    // : isUserAlreadyEnrolled ? <DuplicateRecruitmentFormRedirectPage />
    : (
        <div className='page-layout'>

            {/* Tytul strony */}
            <div className='page-title'> Wniosek o rekrutację na studia podyplomowe</div>
            <div className="course-info">
                <p><strong>KIERUNEK:</strong> {courseInfo.name.toUpperCase()}</p>
                {/* <p><strong>WYDZIAŁ:</strong> {courseInfo.institute.toUpperCase()}</p> */}
            </div>

        <div className='bg-panel'>
            <form>
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
                    <input disabled className="input-readonly" id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} required />

                    <label htmlFor="lastName">Nazwisko</label>
                    <input disabled className="input-readonly" id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} required />

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
                    <input id="birthdate" name="birthdate" type="date" autoComplete="bday" value={formData.birthdate} onChange={handleChange} required />

                    <label htmlFor="birthplace">Miejsce urodzenia</label>
                    <input id="birthplace" name="birthplace" autoComplete="birthplace" value={formData.birthplace} onChange={handleChange} />

                    <label htmlFor="pesel">PESEL</label>
                    <input id="pesel" className={errors.pesel ? 'input-error' : ''} name="pesel" maxLength="11" autoComplete="off" value={formData.pesel} onChange={handleChange} required />

                    <label htmlFor="citizenship">Obywatelstwo</label>
                    <input id="citizenship" name="citizenship" autoComplete="citizenship" value={formData.citizenship} onChange={handleChange} required />
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
                    <input disabled id="email" className="input-readonly" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Telefon</label>
                    <input id="phone" className={errors.phone ? 'input-error' : ''} name="phone" type="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} required />
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
                    <input id="address-street" name="street" autoComplete="address-street" value={formData.residenceAddress.street} onChange={(e) => handleChange(e, 'residenceAddress')} required />

                    <label htmlFor="address-homeNum">Numer domu</label>
                    <input id="address-homeNum" name="house" autoComplete="address-homeNum" value={formData.residenceAddress.house} onChange= {(e) => handleChange(e, 'residenceAddress')} required />

                    <label htmlFor="address-zip">Kod pocztowy</label>
                    <input id="address-zip" className={errors.residenceAddress_postalCode ? 'input-error' : ''} name="postalCode" autoComplete="address-zip" value={formData.residenceAddress.postalCode} onChange={(e) => handleChange(e, 'residenceAddress')} required />
                </div>
                <div className="form-group">
                    <label htmlFor="address-city">Miasto</label>
                    <input id="address-city" name="city" autoComplete="address-city" value={formData.residenceAddress.city} onChange={(e) => handleChange(e, 'residenceAddress')} required />

                    <label htmlFor="address-apartNum">Numer mieszkania</label>
                    <input id="address-apartNum" name="apartment" autoComplete="address-apartNum" value={formData.residenceAddress.apartment} onChange={(e) => handleChange(e, 'residenceAddress')} />

                    <label htmlFor="address-country">Kraj</label>
                    <input id="address-country" name="country" autoComplete="address-country" value={formData.residenceAddress.country} onChange={(e) => handleChange(e, 'residenceAddress')} required />
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
                        <input id="correspondence-street" name="street" autoComplete="correspondence-street" value={formData.correspondenceAddress.street} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />

                        <label htmlFor="correspondence-homeNum">Numer domu</label>
                        <input id="correspondence-homeNum" name="house" autoComplete="correspondence-homeNum" value={formData.correspondenceAddress.house} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />

                        <label htmlFor="correspondence-zip">Kod pocztowy</label>
                        <input id="correspondence-zip" className={errors.correspondenceAddress_postalCode ? 'input-error' : ''} name="postalCode" autoComplete="correspondence-zip" value={formData.correspondenceAddress.postalCode} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="correspondence-city">Miasto</label>
                        <input id="correspondence-city" name="city" autoComplete="correspondence-city" value={formData.correspondenceAddress.city} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />

                        <label htmlFor="correspondence-apartNum">Numer mieszkania</label>
                        <input id="correspondence-apartNum" name="apartment" autoComplete="correspondence-apartNum" value={formData.correspondenceAddress.apartment} onChange={(e) => handleChange(e, 'correspondenceAddress')} />

                        <label htmlFor="correspondence-country">Kraj</label>
                        <input id="correspondence-country" name="country" autoComplete="correspondence-country" value={formData.correspondenceAddress.country} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />
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
                        <input id="studiesName" name="educationUniversity" value={formData.educationUniversity} onChange={handleChange} />

                        <label htmlFor="studiesLocation">Lokalizacja</label>
                        <input id="studiesLocation" name="educationLocation" value={formData.educationLocation} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studiesEndYear">Rok zakończenia</label>
                        <input id="studiesEndYear" name="educationYear" value={formData.educationYear} onChange={handleChange} />

                        <label>Miejsce uzyskania świadectwa dojrzałości *</label>
                        <select
                            className="radio-group"
                            name="educationCountry"
                            value={formData.maturity_country}
                            onChange={handleChange}
                        >
                            <option value="Polska">Polska</option>
                            <option value="Inne">Inne</option>
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
                    <input type="checkbox" checked={hasEmergencyContact} onChange={(e) => setHasEmergencyContact(e.target.checked)} />
                    Chcę dodać kontakt awaryjny
                </label>

                <div className="form-row">
                    {hasEmergencyContact && (
                        <><div className="form-group">
                            <label htmlFor="emergencyName">Imię kontaktu</label>
                            <input id="emergencyName" name="emergencyName" autoComplete="name" value={formData.emergencyName} onChange={handleChange} />

                            <label htmlFor="emergencyPhone">Telefon kontaktu awaryjnego</label>
                            <input id="emergencyPhone" name="emergencyPhone" type="tel" autoComplete="tel" value={formData.emergencyPhone} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="emergencyLastName">Nazwisko kontaktu</label>
                            <input id="emergencyLastName" name="emergencyLastName" autoComplete="family-name" value={formData.emergencyLastName} onChange={handleChange} />
                        </div></>
                    )}
                </div>

                {/* DOKUMENTY */}
                <div className="section-title">
                <span className="material-symbols-outlined text-primary">upload_file</span>
                    Dokumenty
                </div>

                <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    {documents.map(doc => (
                        <DocumentUploadCard
                            key={doc.id}
                            id={doc.id}
                            title={doc.name + (doc.required ? " *" : "")}
                            formats="PDF, DOC"
                            maxSize="5MB"
                            icon="description"
                            onFileSelect={handleFileSelect}
                            onFileRemove={handleFileRemove}
                            required={doc.required}
                            previouslyUploaded={!!existingDocuments[doc.id]}
                        />
                    ))}
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
                        <span className="consent-text">
                            Potwierdzam, że wszystkie podane powyżej dane są zgodne z prawdą w momencie wypełnienia.</span>
                        </label>

                    <label className="consent-item">
                        <input
                            type="checkbox"
                            name="rules"
                            checked={formData.consents.rules}
                            onChange={(e) => handleChange(e, 'consents')}
                        />

                        <div className="consent-content">
                            <span className="consent-text">
                                Potwierdzam, że zapoznałem się z treścia i zobowiązuję się przestrzegać regulaminu studiów AGH.
                            </span>

                            <a
                                className="inline-link consent-link"
                                href="/assets/dokumenty/regulamin-studiow-podyplomowych-agh.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Pełna treść dokumentu.
                                <span className="material-symbols-outlined">open_in_new</span>
                            </a>
                        </div>
                    </label>

                    <label className="consent-item">
                        <input
                            type="checkbox"
                            name="rodo"
                            checked={formData.consents.rodo}
                            onChange={(e) => handleChange(e, 'consents')}
                        />

                        <div className="consent-content">
                            <span className="consent-text">
                                Zgodnie z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (ogólne rozporządzenie o ochronie danych) [Dz. U. UE.L.2016.119.1 z dnia 4 maja 2016 r.], zwanego dalej RODO, wyrażam zgodę na przetwarzanie moich danych osobowych w ramach procesu rekrutacji na powyższe studia i dokumentowanie ich przebiegu.
                            </span>

                            <a
                                className="inline-link consent-link"
                                href="/assets/dokumenty/zgoda_na_przetwarzanie_danych_osobowych.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Pełna treść dokumentu.
                                <span className="material-symbols-outlined">open_in_new</span>
                            </a>
                        </div>
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
            {/*<button className='btn-submit' type='submit' disabled={isUserAlreadyEnrolled}>Wyślij wniosek</button>*/}
            <div className="submit-buttons">
                <button
                    type="button"
                    className="btn-save"
                    onClick={() => submitApplication("SAVE")}
                >
                    Zapisz formularz
                </button>

                <button
                    type="button"
                    className="btn-submit"
                    onClick={() => submitApplication("ENROLL")}
                    disabled={isUserAlreadyEnrolled}
                >
                    Wyślij wniosek
                </button>
            </div>

            </form>
        </div>
        </div>
    ) }
    </div>
  )
}