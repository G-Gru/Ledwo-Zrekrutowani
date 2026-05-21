import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serverApi } from '../services/serverApi';
import { getAccessToken, isLoggedIn } from '../services/authService';
import '../styles/ApplicationForm.css';
import DocumentUploadCard from '../components/DocumentUploadCard'
import LoginRedirectPage from '../components/LoginRedirectPage';
import * as authService from "../services/authService.js";
import AddressTile from '../components/AddressTile.jsx';

const ENROLLMENT_STATUS_CODES = new Set(['DRAFT', 'CANDIDATE', 'RESERVE', 'STUDENT', 'REJECTED', 'EXPELLED']);

const normalizeStatusCode = (status) => String(status || '').trim().toUpperCase();

const getKnownStatusCodes = (status) => {
    const rawStatuses = Array.isArray(status) ? status : [status];
    return rawStatuses
        .map(normalizeStatusCode)
        .filter((code) => ENROLLMENT_STATUS_CODES.has(code));
};

export default function ApplicationForm() {
    // Pobieranie danych uzytkownika
    const [isUserLoggedIn, setUserLoggedIn] = useState(true)
    const [userToken, setUserToken] = useState(null)
    const [isUserAlreadyEnrolled, setUserAlreadyEnrolled] = useState(false)
    const [blockingEnrollmentStatus, setBlockingEnrollmentStatus] = useState('')
    const [enrollmentId, setEnrollmentId] = useState(null)

    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [error, setError] = useState(null);
    const [addrError, setAddrError] = useState(null);

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
        educationUniversity: "", educationLocation: "", educationYear: "", maturityCountry: "Polska",
        emergencyName: "", emergencyLastName: "", emergencyPhone: "",
        consents: { data: false, rules: false, rodo: false }
    });

    // info nieobowiazkowe
    const [hasDifferentCorrespondenceAddress, setHasDifferentCorrespondenceAddress ] = useState(false);
    const [hasEmergencyContact, setHasEmergencyContact] = useState(false);

    // dokumenty
    const [documents, setDocuments] = useState([]);
    const [existingDocuments, setExistingDocuments] = useState({});
    const [files, setFiles] = useState({});

    // zapis formularza
    const [applicationFormRecentlySaved, setApplicationFormRecentlySaved] = useState(false)

    // adresy
    const [addressData, setAddressData] = useState([])
    const [selectedResidenceAddressId, setSelectedResidenceAddressId] = useState(null)
    const [selectedCorrespondenceAddressId, setSelectedCorrespondenceAddressId] = useState(null)
    const [addResidenceAddressExpanded, setAddResidenceAddressExpanded] = useState(null)
    const [addCorrespondenceAddressExpanded, setAddCorrespondenceAddressExpanded] = useState(null)

    const updateAddress = (section, addr) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                street: addr.street || "",
                house: addr.house_number || "",
                apartment: addr.flat_number || "",
                city: addr.city || "",
                country: addr.country || "",
                postalCode: addr.postal_code || ""
            }
        }));
    };

    useEffect(() => {
        const token = getAccessToken();
        if (!token) {
            setUserLoggedIn(false);
            return;
        }

        setUserToken(token);
        setUserLoggedIn(true);

        async function bootstrapForm() {
            const userData = await authService.getUser();

            let mergedFormData = {
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                phone: userData.phone,
            };

            const existingApplication = await serverApi.getExistingApplicationForm(token, courseId);
            let matchedStatusCodes = [];

            if (!existingApplication.error && existingApplication.data) {
                setEnrollmentId(existingApplication.data.enrollment)
                matchedStatusCodes = getKnownStatusCodes(existingApplication.data.status);

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
                setHasDifferentCorrespondenceAddress(hasDifferentCorrespondence);


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


            const otherEnrollmentData = await serverApi.getUserApplications(token);
            if (otherEnrollmentData && Array.isArray(otherEnrollmentData.applications)) {
                const matchingApplication = otherEnrollmentData.applications.find(application => {
                    const editionId = application?.studies_edition?.id ?? application?.studies_edition;
                    return String(editionId) === String(courseId);
                });

                if (matchingApplication) {
                    matchedStatusCodes = getKnownStatusCodes(matchingApplication.status);
                }
            }

            const hasBlockingStatus = matchedStatusCodes.some((code) => code !== 'DRAFT');
            setUserAlreadyEnrolled(hasBlockingStatus);
            setBlockingEnrollmentStatus(hasBlockingStatus ? matchedStatusCodes.find((code) => code !== 'DRAFT') || '' : '');

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

    async function fetchAddressesData() {
        let addressesResponse = await serverApi.getUserAddresses()
        
        if (!addressesResponse || addressesResponse.error) {
            setAddressData([])
            setAddrError( `Error getting user addresses, returning empty (${addressesResponse.errorMsg})` )
        } else {
            setAddressData(addressesResponse.data || [])
            setAddResidenceAddressExpanded(addressesResponse.data.length === 0)
        }
    }

    useEffect( () => {
        fetchAddressesData()
    }, [])
    
    async function addNewAddressToServer( address ) {
        let addressesResponse = await serverApi.addUserAddress( address )
        if (!addressesResponse || addressesResponse.error) {
            setAddrError( `Error adding user address (${addressesResponse.errorMsg})` )
        } else {
            setAddrError(null)
        }
        fetchAddressesData()
    } 
    async function onDeleteAddress( id ) {
        let addressesResponse = await serverApi.deleteUserAddress( id )
        if (!addressesResponse || addressesResponse.error) {
            setAddrError( `Error deleting user address (${addressesResponse.errorMsg})` )
        } else {
            setAddrError(null)
        }
        fetchAddressesData()
    } 
    function setCorrespondenceAddress(addr) {
        updateAddress('correspondenceAddress', addr)
    }

    const handleFileSelect = (id, file) => {
        setFiles(prev => ({ ...prev, [id]: file }));
        setApplicationFormRecentlySaved(false)
    };
    const handleFileRemove = (id) => {
        setFiles(prev => ({ ...prev, [id]: null }));
        setApplicationFormRecentlySaved(false)
    };

    const handleChange = (e, section = null) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setApplicationFormRecentlySaved(false)

        if (section) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section] || {}),
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
    const handleSaveForm = async () => {
        if (isUserAlreadyEnrolled) {
            setError('Ten kierunek ma już aktywne zgłoszenie i formularz nie może być ponownie edytowany.');
            return;
        }

        if (! await handleSubmit('SAVE')) {
            setError("Nie udało się zapisać formularza")
        } else {
            setApplicationFormRecentlySaved(true)
        }
    }

    const handleEnrollForm = async (e) => {
        e.preventDefault();
        await handleSubmit('ENROLL');
    }

    const handleSubmit = async (actionType) => {
        setError(null);

        if (actionType === "ENROLL" && isUserAlreadyEnrolled) {
            setError('Jesteś już zapisany na ten sam kierunek. Nie możesz wysłać kolejnego wniosku.');
            return false;
        }

        if (actionType === "SAVE" && isUserAlreadyEnrolled) {
            setError('Ten formularz nie może być zapisany ponownie, ponieważ zgłoszenie ma już status inny niż draft.');
            return false;
        }

        if (!validate(actionType)) {
            return false;
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
            return true
        } else {
            const message = result
                ? (result.errorDetail || result.errorMsg || 'Błąd komunikacji z serwerem')
                : 'Błąd komunikacji z serwerem';

            setError(`Błąd przy wysyłaniu formularza: ${message}`);
        }
        return false
    };

    const isValidPesel = (pesel) => {
        const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];
        const digits = pesel.split("").map(Number);

        let sum = 0;

        for (let i = 0; i < 10; i++) {
            sum += digits[i] * weights[i];
        }

        const controlDigit = (10 - (sum % 10)) % 10;
        return controlDigit === digits[10];
    };

    const decodePeselBirthdate = (pesel) => {
        const year = parseInt(pesel.slice(0, 2), 10);
        let month = parseInt(pesel.slice(2, 4), 10);
        const day = parseInt(pesel.slice(4, 6), 10);

        let fullYear;
        if (month > 80) {
            fullYear = 1800;
            month -= 80;
        } else if (month > 60) {
            fullYear = 2200;
            month -= 60;
        } else if (month > 40) {
            fullYear = 2100;
            month -= 40;
        } else if (month > 20) {
            fullYear = 2000;
            month -= 20;
        } else {
            fullYear = 1900;
        }

        fullYear += year;
        return new Date(fullYear, month - 1, day);
    };

    const isAtLeast18 = (birthDate) => {
        if (!birthDate) return false;

        const today = new Date();
        const birth = new Date(birthDate);

        const age = today.getFullYear() - birth.getFullYear();

        const hasHadBirthdayThisYear =
            today.getMonth() > birth.getMonth() ||
            (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());

        return hasHadBirthdayThisYear ? age >= 18 : age - 1 >= 18;
    };

    const isValidEducationYear = (year) => {
        if (!year) return false;

        if (!/^\d{4}$/.test(year)) return false;

        const y = Number(year);
        const currentYear = new Date().getFullYear();

        return y >= 1900 && y <= currentYear;
    };

    const validate = (actionType = "ENROLL") => {
        const errors = {};
        const isFinalSubmit = actionType === "ENROLL";
        const isRequired = (condition) => isFinalSubmit || condition;
        const test = (value, regex) => regex.test(value || "");

        const validators = {
            age18: () => {
                if (!isFinalSubmit) return;

                const value = formData.birthdate;

                if (!value) return;

                if (!isAtLeast18(value)) {
                    errors.birthdate = "Musisz mieć ukończone 18 lat.";
                }
            },

            pesel: () => {
                if (!isRequired(formData.pesel)) return;

                if (!test(formData.pesel, /^\d{11}$/)) {
                    errors.pesel = "PESEL musi mieć 11 cyfr.";
                } else if (!isValidPesel(formData.pesel)) {
                    errors.pesel = "PESEL jest niepoprawny."
                }
            },

            birthdatePesel: () => {
                if (!isRequired(formData.birthdate) && !formData.birthdate) return;
                if (!formData.pesel || !formData.birthdate) return;

                const peselDate = decodePeselBirthdate(formData.pesel);
                const inputDate = new Date(formData.birthdate);

                const same =
                    peselDate.getFullYear() === inputDate.getFullYear() &&
                    peselDate.getMonth() === inputDate.getMonth() &&
                    peselDate.getDate() === inputDate.getDate();

                if (!same) {
                    errors.birthdate = "Data urodzenia nie zgadza się z numerem PESEL.";
                }
            },

            phone: () => {
                if (!isRequired(formData.phone) && !formData.phone) return;

                if (!formData.phone || formData.phone.length < 9) {
                    errors.phone = "Numer telefonu jest za krótki.";
                }
            },

            emergencyPhone: () => {
                if (!hasEmergencyContact) return;

                if (!isRequired(formData.emergencyPhone) && !formData.emergencyPhone) return;

                if (!formData.emergencyPhone || formData.emergencyPhone.length < 9) {
                    errors.phone = "Numer telefonu jest za krótki.";
                }
            },

            educationYear: () => {
                if (!isRequired(formData.educationYear) && !formData.educationYear) return;

                if (!isValidEducationYear(formData.educationYear)) {
                    errors.educationYear = "Rok zakończenia jest niepoprawny.";
                }
            },

            residencePostal: () => {
                const value = formData.residenceAddress.postalCode;

                if (!isRequired(value) && !value) return;

                if (!test(value, /^\d{2}-\d{3}$/)) {
                    errors.residenceAddress_postalCode = "Błędny kod pocztowy.";
                }
            },

            correspondencePostal: () => {
                if (!hasDifferentCorrespondenceAddress) return;

                const value = formData.correspondenceAddress.postalCode;

                if (!isRequired(value) && !value) return;

                if (!test(value, /^\d{2}-\d{3}$/)) {
                    errors.correspondenceAddress_postalCode = "Błędny kod pocztowy.";
                }
            },

            consents: () => {
                if (!isFinalSubmit) return;

                if (!formData.consents.data) {
                    errors.data = "Musisz potwierdzić poprawność danych.";
                }

                if (!formData.consents.rules) {
                    errors.rules = "Musisz zaakceptować regulamin.";
                }

                if (!formData.consents.rodo) {
                    errors.rodo = "Zgoda RODO jest wymagana.";
                }
            },

            documents: () => {
                if (!isFinalSubmit) return;

                documents.forEach(doc => {
                    const hasNewFile = !!files[doc.id];
                    const hasExistingFile = !!existingDocuments?.[doc.id];

                    if (doc.required && !hasNewFile && !hasExistingFile) {
                        errors[`doc_${doc.id}`] = `${doc.name} jest wymagany.`;
                    }
                });
            }
        };

        Object.values(validators).forEach(fn => fn());

        setErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const AddressSelectPanel = ({ id, selectedAddressId, onSelectAddress, panelExpanded, onExpandPanel }) => {

        return ( <>
            
        </>)
    }
  
  return (
    <div>
    { !isUserLoggedIn ? <LoginRedirectPage /> 
    : (
        <div className='page-layout'>

            {/* Tytul strony */}
            <div className='page-title'> Wniosek o rekrutację na studia podyplomowe</div>
            <div className="course-info">
                <p><strong>KIERUNEK:</strong> {courseInfo.name.toUpperCase()}</p>
                {/* <p><strong>WYDZIAŁ:</strong> {courseInfo.institute.toUpperCase()}</p> */}
            </div>

        <div className='bg-panel'>
            <form onSubmit={handleEnrollForm}>
                {isUserAlreadyEnrolled && (
                    <div className="error-banner">
                        <span className="material-symbols-outlined">error</span>
                        <div className="error-banner-text">
                            <strong>Już uczestniczysz w rekrutacji do tego kierunku.</strong>
                            <p>Nie możesz wysłać kolejnego wniosku dla tej samej edycji studiów.</p>
                            {blockingEnrollmentStatus && (
                                <p>Aktualny status zgłoszenia: {blockingEnrollmentStatus}.</p>
                            )}
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
                    <label htmlFor="firstName">Imię <span className="required-inline-mark">*</span></label>
                    <input className="input-readonly" id="firstName" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={handleChange} required />

                    <label htmlFor="lastName">Nazwisko <span className="required-inline-mark">*</span></label>
                    <input className="input-readonly" id="lastName" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={handleChange} required />

                    <label htmlFor="title">Tytuł <span className="required-inline-mark">*</span></label>
                    <select name="title" value={formData.title} onChange={handleChange} required>
                        <option value="">Wybierz...</option>
                        <option value="lic">Licencjat</option>
                        <option value="inz">Inżynier</option>
                        <option value="mgr">Magister</option>
                        <option value="mgr_inz">Magister Inżynier</option>
                        <option value="dr">Doktor</option>
                    </select>

                    <label htmlFor="familyName">Nazwisko rodowe <span className="required-inline-mark">*</span></label>
                    <input id="familyName" name="familyName" autoComplete="family-name" value={formData.familyName} onChange={handleChange} required/>
                </div>

                <div className="form-group">
                    <label htmlFor="birthdate">Data urodzenia <span className="required-inline-mark">*</span></label>
                    <input id="birthdate" name="birthdate" type="date" autoComplete="bday" value={formData.birthdate} onChange={handleChange} required />

                    <label htmlFor="birthplace">Miejsce urodzenia <span className="required-inline-mark">*</span></label>
                    <input id="birthplace" name="birthplace" autoComplete="country-name" value={formData.birthplace} onChange={handleChange} required/>

                    <label htmlFor="pesel">PESEL <span className="required-inline-mark">*</span></label>
                    <input id="pesel" className={errors.pesel ? 'input-error' : ''} name="pesel"
                           type="text" inputMode="numeric" pattern="\d{11}" maxLength={11}
                           value={formData.pesel} onChange={handleChange} required />

                    <label htmlFor="citizenship">Obywatelstwo <span className="required-inline-mark">*</span></label>
                    <input id="citizenship" name="citizenship" value={formData.citizenship} onChange={handleChange} required />
                </div>
            </div>

            {/* DANE KONTAKTOWE */}
            <div className="section-title">
                <span className="material-symbols-outlined text-primary">contact_mail</span>
                Dane kontaktowe
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="email">Email <span className="required-inline-mark">*</span></label>
                    <input id="email" className="input-readonly" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Telefon <span className="required-inline-mark">*</span></label>
                    <input id="phone" className="input-readonly" name="phone" type="tel" inputMode="tel" autoComplete="tel" value={formData.phone} onChange={handleChange} required />
                </div>
            </div>
            
            {/* Dane adresowe */}
            <div className="section-title">
                <span className="material-symbols-outlined text-primary">home</span>
                Dane adresowe
            </div>  
            
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }}>
                { addressData && addressData.length > 0 ?
                    addressData.map((item) => {
                        const isSelected = selectedResidenceAddressId === item.id;

                        return (
                            <AddressTile
                                key={`${0}-${item.id}`}
                                data={item}
                                selected={isSelected}
                                onDeleteAddress={onDeleteAddress}
                                onSelect={() => {
                                    setSelectedResidenceAddressId(item.id)
                                    updateAddress('residenceAddress', item)
                                    if (!hasDifferentCorrespondenceAddress) {
                                        updateAddress('correspondenceAddress', item)
                                        setSelectedCorrespondenceAddressId(null)
                                    }
                                }}
                                selectedMessage={`Zaznaczono jako adres zamieszkania`}
                            />
                        )
                    }) : null
                }
            </div>

            {/* addr error msg */}
            {addrError && <div className="error-message">{addrError}</div> }

            { !addResidenceAddressExpanded ?
                <button className='show-add-adress-panel-button' type="button" name="action"
                    onClick={() => { setAddResidenceAddressExpanded(true); setAddrError(null)} }> 
                    Dodaj inny adres 
                </button> : (null)
            }

            { addResidenceAddressExpanded ? <>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="address-street">Ulica <span className="required-inline-mark">*</span></label>
                        <input id="address-street" name="street" autoComplete="address-line1" value={formData.residenceAddress.street} onChange={(e) => handleChange(e, 'residenceAddress')} required />

                        <label htmlFor="address-homeNum">Numer domu <span className="required-inline-mark">*</span></label>
                        <input id="address-homeNum" name="house" autoComplete="address-line2" value={formData.residenceAddress.house} onChange= {(e) => handleChange(e, 'residenceAddress')} required />

                        <label htmlFor="address-zip">Kod pocztowy <span className="required-inline-mark">*</span></label>
                        <input id="address-zip" className={errors.residenceAddress_postalCode ? 'input-error' : ''} name="postalCode"
                            type="text" inputMode="numeric" pattern="\d{2}-\d{3}" maxLength={6} autoComplete="postal-code"
                            value={formData.residenceAddress.postalCode} onChange={(e) => handleChange(e, 'residenceAddress')} required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address-city">Miasto <span className="required-inline-mark">*</span></label>
                        <input id="address-city" name="city" autoComplete="address-level2" value={formData.residenceAddress.city} onChange={(e) => handleChange(e, 'residenceAddress')} required />

                        <label htmlFor="address-apartNum">Numer mieszkania</label>
                        <input id="address-apartNum" name="apartment" value={formData.residenceAddress.apartment} onChange={(e) => handleChange(e, 'residenceAddress')} />

                        <label htmlFor="address-country">Kraj <span className="required-inline-mark">*</span></label>
                        <input id="address-country" name="country" autoComplete="country-name" value={formData.residenceAddress.country} onChange={(e) => handleChange(e, 'residenceAddress')} required />
                    </div>
                </div>

                <button className='add-adress-button' type="button" name="action"
                    onClick={ () => {
                        addNewAddressToServer( {
                            "street": formData.residenceAddress.street,
                            "house_number": formData.residenceAddress.house,
                            "flat_number": formData.residenceAddress.apartment,
                            "city": formData.residenceAddress.city,
                            "country": formData.residenceAddress.country,
                            "postal_code": formData.residenceAddress.postalCode
                        });
                        setAddResidenceAddressExpanded(false);
                }}> Przypisz nowy adres do konta </button>

                </> : (null) 
            }

            <div> 
                <label className="checkbox-container">
                    <input
                        type="checkbox"
                        checked={hasDifferentCorrespondenceAddress}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setHasDifferentCorrespondenceAddress(checked);

                            if (!checked) {
                                updateAddress('correspondenceAddress', {
                                    street: formData.residenceAddress.street,
                                    house_number: formData.residenceAddress.house,
                                    flat_number: formData.residenceAddress.apartment,
                                    city: formData.residenceAddress.city,
                                    country: formData.residenceAddress.country,
                                    postal_code: formData.residenceAddress.postalCode
                                });
                                setSelectedCorrespondenceAddressId(null);
                            }
                        }}
                    />
                    Adres korespondencyjny jest inny niż zamieszkania
                </label>
            </div>

            { hasDifferentCorrespondenceAddress && ( <div>
                {/* Dane adresowe */}
                <div className="section-title">
                    <span className="material-symbols-outlined text-primary">home</span>
                    Dane do korespondencji
                </div>  
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    { addressData && addressData.length > 0 ?
                        addressData.map((item) => {
                            const isSelected = selectedCorrespondenceAddressId === item.id;

                            return (
                                <AddressTile
                                    key={`1-${item.id}`}
                                    data={item}
                                    selected={isSelected}
                                    onDeleteAddress={onDeleteAddress}
                                    onSelect={() => {
                                        setSelectedCorrespondenceAddressId(item.id)
                                        updateAddress('correspondenceAddress', item)
                                    }}
                                    selectedMessage={`Zaznaczono jako adres korespondencyjny`}
                                />
                            )
                        }) : null
                    }
                </div>

                {/* addr error msg */}
                {addrError && <div className="error-message">{addrError}</div> }

                { !addCorrespondenceAddressExpanded ?
                    <button className='show-add-adress-panel-button' type="button" name="action"
                        onClick={() => { setAddCorrespondenceAddressExpanded(true); setAddrError(null)} }> 
                        Dodaj inny adres 
                    </button> : (null)
                }

                { addCorrespondenceAddressExpanded ? <>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="address-street">Ulica <span className="required-inline-mark">*</span></label>
                            <input id="address-street" name="street" autoComplete="address-line1" value={formData.correspondenceAddress.street} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />

                            <label htmlFor="address-homeNum">Numer domu <span className="required-inline-mark">*</span></label>
                            <input id="address-homeNum" name="house" autoComplete="address-line2" value={formData.correspondenceAddress.house} onChange= {(e) => handleChange(e, 'correspondenceAddress')} required />

                            <label htmlFor="address-zip">Kod pocztowy <span className="required-inline-mark">*</span></label>
                            <input id="address-zip" className={errors.correspondenceAddress_postalCode ? 'input-error' : ''} name="postalCode"
                                type="text" inputMode="numeric" pattern="\d{2}-\d{3}" maxLength={6} autoComplete="postal-code"
                                value={formData.correspondenceAddress.postalCode} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />
                        </div>

                        <div className="form-group">
                            <label htmlFor="address-city">Miasto <span className="required-inline-mark">*</span></label>
                            <input id="address-city" name="city" autoComplete="address-level2" value={formData.correspondenceAddress.city} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />

                            <label htmlFor="address-apartNum">Numer mieszkania</label>
                            <input id="address-apartNum" name="apartment" value={formData.correspondenceAddress.apartment} onChange={(e) => handleChange(e, 'correspondenceAddress')} />

                            <label htmlFor="address-country">Kraj <span className="required-inline-mark">*</span></label>
                            <input id="address-country" name="country" autoComplete="country-name" value={formData.correspondenceAddress.country} onChange={(e) => handleChange(e, 'correspondenceAddress')} required />
                        </div>
                    </div>

                    <button className='add-adress-button' type="button" name="action"
                        onClick={ () => {
                            addNewAddressToServer( {
                                "street": formData.correspondenceAddress.street,
                                "house_number": formData.correspondenceAddress.house,
                                "flat_number": formData.correspondenceAddress.apartment,
                                "city": formData.correspondenceAddress.city,
                                "country": formData.correspondenceAddress.country,
                                "postal_code": formData.correspondenceAddress.postalCode
                            });
                            setAddCorrespondenceAddressExpanded(false);
                    }}> Przypisz nowy adres do konta </button>

                    </> : (null) 
                }
            </div> )}

            {/* WYKSZTALCENIE */}
            <div className="section-title">
                <span className="material-symbols-outlined text-primary">school</span>
                Wykształcenie
                </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="studiesName">Nazwa uczeli wyższej <span className="required-inline-mark">*</span></label>
                    <input id="studiesName" name="educationUniversity" value={formData.educationUniversity} onChange={handleChange} required/>

                    <label htmlFor="studiesLocation">Lokalizacja <span className="required-inline-mark">*</span></label>
                    <input id="studiesLocation" name="educationLocation" value={formData.educationLocation} onChange={handleChange} required/>
                </div>
                <div className="form-group">
                    <label htmlFor="educationYear">Rok zakończenia <span className="required-inline-mark">*</span></label>
                    <input id="educationYear" name="educationYear" type="text" inputMode="numeric"
                            pattern="\d{4}" maxLength={4} value={formData.educationYear} onChange={handleChange}
                            className={errors.educationYear ? 'input-error' : ''} required/>

                    <label>Miejsce uzyskania świadectwa dojrzałości <span className="required-inline-mark">*</span></label>
                    <select
                        className="radio-group"
                        name="maturityCountry"
                        value={formData.maturityCountry}
                        onChange={handleChange}
                        required
                    >
                        <option value="Polska">Polska</option>
                        <option value="Poza Polską">Poza Polską</option>
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
                        <input id="emergencyPhone" name="emergencyPhone" type="tel" inputMode="tel" autoComplete="tel" value={formData.emergencyPhone} onChange={handleChange} />
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
                        <span className="required-inline-mark">*</span>
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
                            <span className="required-inline-mark">*</span>
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
                            <span className="required-inline-mark">*</span>
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
            <div className="submit-buttons">
                <button
                    type="button"
                    className={"btn-save"}
                    name="action"
                    value=""
                    onClick={handleSaveForm}
                    disabled={isUserAlreadyEnrolled}
                    style={{
                        background: applicationFormRecentlySaved ? "lightgrey" : ""
                    }}
                >
                    {applicationFormRecentlySaved ? 'Zapisano!' : 'Zapisz formularz'}
                </button>

                <button
                    type="submit"
                    className="btn-submit"
                    name="action"
                    value="ENROLL"
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