
import { getAccessToken, getUser } from './authService';
import {
    getMockAdminEnrollmentDetails,
    getMockAdminEnrollmentList,
    saveMockAdminEnrollmentDecision,
} from '../mocks/adminEnrollmentMocks';
import { formatDateInWarsaw } from '../utils/dateTime';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class serverApi {
    // Pomocnicza metoda do zapytań
    static async apiRequest(endpoint, method = 'GET', body = null, token = null, useJsonStringData = true, isBlob = false) {
        console.log(`Calling server API at endpoint: ${method} ${endpoint}`)

        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        // Don't set Content-Type always, cant upload files
        if (useJsonStringData) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? (useJsonStringData ? JSON.stringify(body) : body) : null,
            });

            if (!response.ok) {
                let errorDetail = "";
                try {
                    const errorData = await response.json();
                    if (typeof errorData === 'string') {
                        errorDetail = errorData;
                    } else if (Array.isArray(errorData)) {
                        errorDetail = errorData.join(', ');
                    } else if (errorData && typeof errorData === 'object') {
                        if ('detail' in errorData) {
                            if (Array.isArray(errorData.detail)) {
                                errorDetail = errorData.detail.join(', ');
                            } else {
                                errorDetail = String(errorData.detail);
                            }
                        } else {
                            errorDetail = Object.entries(errorData)
                                .map(([key, value]) => {
                                    if (Array.isArray(value)) {
                                        return `${key}: ${value.join(', ')}`;
                                    }
                                    if (typeof value === 'object') {
                                        try {
                                            return `${key}: ${JSON.stringify(value)}`;
                                        } catch {
                                            return `${key}: ${String(value)}`;
                                        }
                                    }
                                    return `${key}: ${String(value)}`;
                                })
                                .join('; ');
                        }
                    }
                } catch {
                    errorDetail = response.statusText;
                }
                return {data: null, error: true, errorMsg: `HTTP ${response.status}`, errorDetail};
            }

            if (isBlob) {
                return {data: response, error: false};
            }

            const data = await response.json();
            return {data, error: false, errorMsg: ""};
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
            return {data: null, error: true, errorMsg: err.message, errorDetail: err.detail};
        }
    }

    static getUserData() {
        const user = getUser();
        if (user) {
            return {
                firstName: user.firstName || user.name || user.first_name || "Imie",
                lastName: user.lastName || user.last_name || "Nazwisko",
                email: user.email || "ziomeczek@mail.com"
            };
        }
        return {firstName: "Imie", lastName: "Nazwisko", email: "ziomeczek@mail.com"};
    }

    static todayIsBefore(dateString) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for date comparison
        const givenDate = new Date(dateString);
        givenDate.setHours(0, 0, 0, 0);
        return today < givenDate;
    }

    static #buildEmptyAdminEnrollmentDetails(summary = {}) {
        return {
            id: summary.id || null,
            student_name: summary.student_name || 'Nieznany kandydat',
            status: summary.status || '-',
            status_note: summary.status_note || '',
            enrollment_date: summary.enrollment_date || null,
            is_fully_paid: Boolean(summary.is_fully_paid),
            missing_documents: Boolean(summary.missing_documents),
            system_status: summary.system_status || '-',
            studies_name: summary.studies_name || 'Nieznany kierunek',
            edition_name: summary.edition_name || 'Nieznana edycja',
            personal: {
                first_name: '',
                second_name: '',
                last_name: '',
                family_name: '',
                academic_title: '',
                birth_date: '',
                birth_place: '',
                pesel: '',
                citizenship: '',
            },
            contact: {
                email: '',
                phone: '',
            },
            residential_address: null,
            registered_address: null,
            education: {
                description: '',
                country: '',
            },
            emergency_contact: {
                name: '',
                surname: '',
                relation: '',
                phone: '',
            },
            documents: [],
            fees: [],
        };
    }

    static #normalizeAdminEnrollmentDetails(detailData, documents = [], fees = []) {
        if (!detailData || typeof detailData !== 'object') {
            return null;
        }

        const formData = detailData.form_data && typeof detailData.form_data === 'object'
            ? detailData.form_data
            : {};

        const normalized = this.#buildEmptyAdminEnrollmentDetails({
            id: detailData.id,
            student_name: detailData.student_name,
            status: detailData.status,
            status_note: detailData.status_note,
            enrollment_date: detailData.enrollment_date,
            is_fully_paid: detailData.is_fully_paid,
            missing_documents: detailData.missing_documents,
            system_status: detailData.system_status,
            studies_name: detailData.studies_name || detailData.studies_edition?.name,
            edition_name: detailData.edition_name || detailData.studies_edition?.name,
        });

        normalized.personal = {
            first_name: formData.first_name || '',
            second_name: formData.second_name || '',
            last_name: formData.last_name || '',
            family_name: formData.family_name || '',
            academic_title: formData.academic_title || '',
            birth_date: formData.birth_date || '',
            birth_place: formData.birth_place || '',
            pesel: formData.pesel || '',
            citizenship: formData.citizenship || '',
        };

        normalized.contact = {
            email: formData.email || '',
            phone: formData.phone || '',
        };

        normalized.residential_address = formData.residential_address || null;
        normalized.registered_address = formData.registered_address || null;

        normalized.education = {
            description: formData.education || '',
            country: formData.education_country || '',
        };

        normalized.emergency_contact = {
            name: formData.emergency_first_name || '',
            surname: formData.emergency_last_name || '',
            relation: formData.emergency_contact || '',
            phone: formData.emergency_phone || '',
        };

        normalized.documents = Array.isArray(documents)
            ? documents.map((item, index) => ({
                id: item.id || `doc-${index}`,
                title: item.studies_document?.name || item.title || item.name || 'Dokument',
                required: Boolean(item.required || item.studies_document?.required),
                status: item.status || 'SUBMITTED',
                file_name: item.file_name || item.file || item.original_name || '-',
                submitted_date: item.submitted_date || null,
            }))
            : [];

        normalized.fees = Array.isArray(fees)
            ? fees.map((item, index) => ({
                id: item.id || `fee-${index}`,
                title: item.title || 'Opłata',
                amount: item.amount ? `${item.amount} PLN` : '-',
                due_date: item.due_date || null,
                paid_date: item.paid_date || null,
                status: item.paid_date ? 'Opłacona' : 'Nieopłacona',
            }))
            : [];

        return normalized;
    }

    static async sendApplicationForm(token, applicationForm, createNew) {
        if (!applicationForm) {
            return {
                data: null,
                error: true,
                errorMsg: "Missing application form data",
                errorDetail: "applicationForm is required"
            };
        }

        const placeholderAddress = {
            street: "Brak danych",
            house_number: "0",
            flat_number: "",
            city: "Brak danych",
            country: "Polska",
            postal_code: "00-000"
        };

        const normalizeAddressPayload = (address) => ({
            street: address?.street || "",
            house_number: address?.house || "",
            flat_number: address?.apartment || "",
            city: address?.city || "",
            country: address?.country || "Polska",
            postal_code: address?.postalCode || ""
        });

        const ensureAddressPayload = (payload) => {
            if (payload.street || payload.house_number || payload.flat_number || payload.city || payload.postal_code) {
                return payload;
            }
            return {...placeholderAddress};
        };

        const findExistingAddressId = async (addressPayload) => {
            const getExisting = await this.apiRequest('/api/enrollments/addresses/', 'GET', null, token);
            if (getExisting.error) {
                return {
                    error: true,
                    errorMsg: getExisting.errorMsg || 'Failed to search existing address',
                    errorDetail: getExisting.errorDetail || null
                };
            }

            const matches = Array.isArray(getExisting.data)
                ? getExisting.data.filter(addr =>
                    addr.street === addressPayload.street &&
                    addr.house_number === addressPayload.house_number &&
                    addr.flat_number === addressPayload.flat_number &&
                    addr.city === addressPayload.city &&
                    addr.country === addressPayload.country &&
                    addr.postal_code === addressPayload.postal_code
                )
                : [];

            if (matches.length > 0) {
                return {error: false, id: matches[0].id};
            }
            return {error: false, id: null};
        };

        const createAddress = async (addressPayload) => {
            const res = await this.apiRequest('/api/enrollments/addresses/', 'POST', addressPayload, token);
            if (res.error) {
                return {
                    error: true,
                    errorMsg: res.errorMsg || 'Failed to create address',
                    errorDetail: res.errorDetail || null
                };
            }
            return {error: false, id: res.data.id};
        };

        const residencePayload = ensureAddressPayload(normalizeAddressPayload(applicationForm.formData.residenceAddress || {}));
        const correspondencePayload = normalizeAddressPayload(applicationForm.formData.correspondenceAddress || {});

        let residenceAddressId = null;
        const existingResidence = await findExistingAddressId(residencePayload);
        if (existingResidence.error) {
            return existingResidence;
        }
        residenceAddressId = existingResidence.id;
        if (!residenceAddressId) {
            const createdResidence = await createAddress(residencePayload);
            if (createdResidence.error) {
                return createdResidence;
            }
            residenceAddressId = createdResidence.id;
        }

        let correspondenceAddressId = null;
        const correspondenceIsEmpty = !correspondencePayload.street && !correspondencePayload.house_number && !correspondencePayload.flat_number && !correspondencePayload.city && !correspondencePayload.postal_code;
        if (correspondenceIsEmpty) {
            correspondenceAddressId = residenceAddressId;
        } else {
            const existingCorrespondence = await findExistingAddressId(ensureAddressPayload(correspondencePayload));
            if (existingCorrespondence.error) {
                return existingCorrespondence;
            }
            correspondenceAddressId = existingCorrespondence.id;
            if (!correspondenceAddressId) {
                const createdCorrespondence = await createAddress(ensureAddressPayload(correspondencePayload));
                if (createdCorrespondence.error) {
                    return createdCorrespondence;
                }
                correspondenceAddressId = createdCorrespondence.id;
            }
        }

        const filesPayload = Object.entries(applicationForm.files || {})
            .filter(([, file]) => file)
            .map(([docId, file]) => ({
                studies_document_id: Number(docId),
                file
            }));

        const payload = new FormData();

        payload.append("action", applicationForm.action || "SAVE");

        payload.append("first_name", applicationForm.formData.firstName);
        payload.append("second_name", applicationForm.formData.secondName);
        payload.append("last_name", applicationForm.formData.lastName);
        payload.append("family_name", applicationForm.formData.familyName);

        payload.append("academic_title", applicationForm.formData.title);
        payload.append("birth_place", applicationForm.formData.birthplace);
        payload.append("birth_date", applicationForm.formData.birthdate);
        payload.append("pesel", applicationForm.formData.pesel);
        payload.append("citizenship", applicationForm.formData.citizenship);

        payload.append("residential_address", residenceAddressId);
        payload.append("registered_address", correspondenceAddressId);

        payload.append("email", applicationForm.formData.email);
        payload.append("phone", applicationForm.formData.phone);

        payload.append("education_university", applicationForm.formData.educationUniversity);
        payload.append("education_year", applicationForm.formData.educationYear);
        payload.append("education_location", applicationForm.formData.educationLocation);
        payload.append("maturity_country", applicationForm.formData.maturity_country);

        payload.append("emergency_name", applicationForm.formData.emergencyName);
        payload.append("emergency_last_name", applicationForm.formData.emergencyLastName);
        payload.append("emergency_phone", applicationForm.formData.emergencyPhone);

        filesPayload.forEach((f) => {
            payload.append("files_ids", f.studies_document_id);
            payload.append("files_uploads", f.file);
        });

        // console.log(formFullData)

        const result = createNew ?
            await this.apiRequest(
                `/api/enrollments/editions/${applicationForm.studies_edition_id}/`,
                'POST',
                payload,
                token,
                false
            ) :
            await this.apiRequest(
                `/api/enrollments/editions/${applicationForm.studies_edition_id}/form/`,
                'PUT',
                payload,
                token,
                false
            );

        if (result.error) {
            return {
                data: null,
                error: true,
                errorMsg: result.errorMsg,
                errorDetail: result.errorDetail
            };
        }

        return {
            data: result.data,
            error: false,
            errorMsg: '',
            errorDetail: ''
        };
    }

    static async getExistingApplicationForm(token, studiesEditionId) {
        if (!studiesEditionId) {
            return {
                data: null,
                error: true,
                errorMsg: "Missing studies edition id",
                errorDetail: "studiesEditionId is required"
            };
        }

        const result = await this.apiRequest(
            `/api/enrollments/editions/${studiesEditionId}/form/`,
            'GET',
            null,
            token
        );

        if (result.error) {
            const status = result.status || result.errorStatus;

            if (status === 404) {
                return {
                    data: null,
                    error: false,
                    errorMsg: '',
                    errorDetail: ''
                };
            }

            return {
                data: null,
                error: true,
                errorMsg: result.errorMsg || 'Failed to fetch existing application form',
                errorDetail: result.errorDetail || null
            };
        }

        return {
            data: result.data,
            error: false,
            errorMsg: '',
            errorDetail: ''
        };
    }

    static async getEnrollmentDocuments(token, enrollmentId) {
        if (!enrollmentId) {
            return {
                data: null,
                error: true,
                errorMsg: "Missing enrollment id",
                errorDetail: "enrollmentId is required"
            };
        }

        const result = await this.apiRequest(
            `/api/enrollments/${enrollmentId}/documents/`,
            'GET',
            null,
            token
        );

        if (result.error) {
            const status = result.status || result.errorStatus;

            if (status === 404) {
                return {
                    data: [],
                    error: false,
                    errorMsg: '',
                    errorDetail: ''
                };
            }

            return {
                data: null,
                error: true,
                errorMsg: result.errorMsg || 'Failed to fetch enrollment documents',
                errorDetail: result.errorDetail || null
            };
        }

        return {
            data: result.data,
            error: false,
            errorMsg: '',
            errorDetail: ''
        };
    }

    static async getAddressById(token, addressId) {
        if (!addressId) {
            return {
                data: null,
                error: true,
                errorMsg: "Missing address id",
                errorDetail: "addressId is required"
            };
        }

        const result = await this.apiRequest(
            `/api/enrollments/addresses/${addressId}/`,
            'GET',
            null,
            token
        );

        if (result.error) {
            return {
                data: null,
                error: true,
                errorMsg: result.errorMsg || 'Failed to fetch address',
                errorDetail: result.errorDetail || null
            };
        }

        return {
            data: result.data,
            error: false,
            errorMsg: '',
            errorDetail: ''
        };
    }

    static async mapExistingApplicationToFormData(token, existingData) {
        if (!existingData) return null;

        let residenceAddress = {
            street: "",
            house: "",
            apartment: "",
            city: "",
            country: "Polska",
            postalCode: ""
        };

        let correspondenceAddress = {
            street: "",
            house: "",
            apartment: "",
            city: "",
            country: "Polska",
            postalCode: ""
        };

        if (existingData.residential_address) {
            const residenceResult = await this.getAddressById(token, existingData.residential_address);

            if (!residenceResult.error && residenceResult.data) {
                residenceAddress = {
                    street: residenceResult.data.street || "",
                    house: residenceResult.data.house_number || "",
                    apartment: residenceResult.data.flat_number || "",
                    city: residenceResult.data.city || "",
                    country: residenceResult.data.country || "Polska",
                    postalCode: residenceResult.data.postal_code || ""
                };
            }
        }

        if (existingData.registered_address) {
            const correspondenceResult = await this.getAddressById(token, existingData.registered_address);

            if (!correspondenceResult.error && correspondenceResult.data) {
                correspondenceAddress = {
                    street: correspondenceResult.data.street || "",
                    house: correspondenceResult.data.house_number || "",
                    apartment: correspondenceResult.data.flat_number || "",
                    city: correspondenceResult.data.city || "",
                    country: correspondenceResult.data.country || "Polska",
                    postalCode: correspondenceResult.data.postal_code || ""
                };
            }
        }

        return {
            firstName: existingData.first_name || "",
            secondName: existingData.second_name || "",
            lastName: existingData.last_name || "",
            familyName: existingData.family_name || "",
            title: existingData.academic_title || "",
            birthplace: existingData.birth_place || "",
            birthdate: existingData.birth_date || "",
            pesel: existingData.pesel || "",
            citizenship: existingData.citizenship || "",
            email: existingData.email || "",
            phone: existingData.phone || "",

            educationUniversity: existingData.education_university || "",
            educationLocation: existingData.education_location || "",
            educationYear: existingData.education_year || "",
            educationCountry: existingData.education_country || "",

            emergencyName: existingData.emergency_name || "",
            emergencyLastName: existingData.emergency_last_name || "",
            emergencyPhone: existingData.emergency_phone || "",

            residenceAddress: residenceAddress,
            correspondenceAddress: correspondenceAddress
        };
    }

    static async getStudiesEditionDocuments(token, studiesEditionId) {
        if (!studiesEditionId) {
            return {
                data: null,
                error: true,
                errorMsg: "Missing studies edition id",
                errorDetail: "studiesEditionId is required"
            };
        }

        const result = await this.apiRequest(
            `/api/studies/editions/${studiesEditionId}/documents/`,
            'GET',
            null,
            token
        );

        if (result.error) {
            return {
                data: null,
                error: true,
                errorMsg: result.errorMsg || 'Failed to fetch edition documents',
                errorDetail: result.errorDetail || null
            };
        }

        return {
            data: result.data,
            error: false,
            errorMsg: '',
            errorDetail: ''
        };
    }

    static async getCourseInfo(editionId) {
        const res = await this.apiRequest(`/api/studies/editions/${editionId}/`, 'GET', null, getAccessToken());
        if (res && !res.error && res.data) return res.data
        return {name: "Nieznany kierunek", recruitment_end_date: "2000-01-01", status: "-"};
    }

    static async getCoursesInfo() {
        const res = await this.apiRequest('/api/studies/editions/', 'GET');
        if (!res.error) {
            return res.data
        }
        return {}
    }

    /* Applications */

    // dane: application { name: "", type: "", status: [""],  schedule: [title: "", startDate: "", endDate: "", flag: ""] }
    static async getUserUnfinishedApplications(userToken) {
        // let mock_schedule = await this.generateRecruitmentApplicationSchedule(null, null, false)
        return {
            applications: [
                // { name: "Niewypełniony wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje wypełnienia"],
                // schedule: mock_schedule }
            ],
            error: true,
            errorMsg: "" //"Pobieranie roboczych wniosków: Funkcjonalnosc niezaimplementowana: wyświetlane dane mock-owe."
        }
    }

    static async getUserActiveApplications(token) {

        const res = await this.apiRequest('/api/enrollments/active/', 'GET', null, token);

        if (res.error) {
            /* mockowe dane */
            return {
                applications: null,
                // [
                //     { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje odpowiedźi"], schedule: this.generateRecruitmentApplicationSchedule(), id: 1 },
                //     { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Brak zapłaty"], schedule: this.generateRecruitmentApplicationSchedule(), id: 2 }
                // ],
                error: true,
                errorMsg: `Pobieranie aktywnych wniosków: Błąd komunikacji z serwerem. Wyświetlane dane mock-owe (${res.errorMsg})`
            }
        }


        // Mapowanie danych z backendu na format frontendowy
        const mapped = await Promise.all(res.data.map(async item => {
            const schedule = await serverApi.generateRecruitmentApplicationSchedule(token, item.id, true, formatDateInWarsaw(item.studies_edition.recruitment_end_date), item.status)
            let isPaymentComplete = schedule?.[1]?.flag === "complete"
            let isDocuementsComplete = schedule?.[2]?.flag === "complete"
            let statuses = [item.status]
            if (!isPaymentComplete) statuses.push("Wymaga płatności")
            if (!isDocuementsComplete) statuses.push("Brak dostarczonych dokumentów")

            return {
                id: item.id,
                studies_edition: item.studies_edition,
                name: "Wniosek rekrutacyjny",
                status: statuses,
                schedule,
                isPaymentComplete,
            };
        }));

        return {applications: mapped, error: false, errorMsg: ""};
    }

    /* Payments */
    static async getUserActivePayments(token) {
        let paymentsResponse = await serverApi.apiRequest('/api/payments/upcoming/', 'GET', null, token)

        if (paymentsResponse.error) {
            let mock_data = [
                {
                    id: 1,
                    name: "Czesne (Semestr Zimowy)",
                    status: "Oczekuje",
                    amount: "3,200.00 PLN",
                    date: "15.10.2023",
                    type: "pending"
                },
                {id: 2, name: "Wpisowe", status: "Zaległe", amount: "250.00 PLN", date: "30.09.2023", type: "overdue"}
            ];
            return {
                payments: mock_data,
                error: true,
                errorMsg: `Pobieranie nadchodzących płatności: bład komunikacji z serwerem, wyświetlane dane mock-owe. ${paymentsResponse.errorMsg}`
            }
        }

        const mapped = paymentsResponse.data.map(item => ({
            id: item.id,
            title: item.title,
            amount: item.amount + " PLN",
            due_date: item.due_date,
            status: serverApi.todayIsBefore(item.due_date) ? "Oczekuje" : "Po terminie ostatecznym",
            type: serverApi.todayIsBefore(item.due_date) ? "pending" : "overdue",
        }))
        return {payments: mapped, error: false, errorMsg: ""}
    }

    static async getUserPaymentsHistory(token) {

        let paymentsResponse = await serverApi.apiRequest('/api/payments/history/', 'GET', null, token)

        if (paymentsResponse.error) {
            let mock_data = [
                {
                    id: 101,
                    title: "Czesne (Semestr Letni)",
                    paid_date: "12.06.2023",
                    amount: "3,200.00 PLN",
                    status: "Zaksięgowano"
                },
                {
                    id: 102,
                    title: "Opłata za legitymację",
                    paid_date: "01.06.2023",
                    amount: "22.00 PLN",
                    status: "Zaksięgowano"
                },
                {id: 103, title: "Ubezpieczenie", paid_date: "15.05.2023", amount: "55.00 PLN", status: "Zaksięgowano"}
            ];
            return {
                payments: mock_data,
                error: true,
                errorMsg: `Pobieranie historii płatności: bład komunikacji z serwerem, wyświetlane dane mock-owe. ${paymentsResponse.errorMsg}`
            }
        }

        const mapped = paymentsResponse.data.map(item => ({
            id: item.id,
            title: item.title,
            amount: item.amount + " PLN",
            paid_date: item.paid_date,
            status: "Zaksięgowano" // na raize wszytkie takie
        }))
        return {payments: mapped, error: false, errorMsg: ""}

    }

    static async userPayment(token, paymentIds) {
        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return {success: false, errorMsg: "Brak ID płatności do opłacenia."};
        }

        const results = [];
        for (const feePk of paymentIds) {
            const res = await serverApi.apiRequest(`/api/payments/${feePk}/pay/`, 'POST', null, token);
            results.push({id: feePk, success: !res.error, errorMsg: res.error ? res.errorMsg : ""});
        }

        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            return {success: false, errorMsg: `Błąd podczas opłacania płatności: ${failed[0].errorMsg}`};
        }

        return {success: true, errorMsg: ""};
    }

    /* HELPER schedule generator for applications */
    static async generateRecruitmentApplicationSchedule(userToken = null, application_id = null, isActive = true, recruitmentEndDate = "--/--/----", candidateStatus = "CANDIDATE") {

        /* general recruit schedule */
        const recruitmentSchedule = [
            {
                title: "SKŁADANIE WNIOSKÓW",
                startDate: "--/--/--",
                endDate: recruitmentEndDate,
                flag: isActive ? "complete" : "in-progress"
            },
            {
                title: "OPŁATA REKRUTACYJNA",
                startDate: "--/--/--",
                endDate: recruitmentEndDate,
                flag: isActive ? "in-progress" : "upcoming"
            },
            {
                title: "PRZYNIESIENIE DOKUMENTÓW",
                startDate: "--/--/--",
                endDate: recruitmentEndDate,
                flag: isActive ? "in-progress" : "upcoming"
            },
            {title: "DECYZJA KOMISJI", startDate: recruitmentEndDate, endDate: "--/--/--", flag: "upcoming"}
        ]

        if (userToken == null || application_id == null) return recruitmentSchedule;

        /* set recruitment end date for all steps */
        // let recruitmentEndDateResponse = await serverApi.apiRequest(`/api/enrollment/${application_id}/recruitment_end_date/`, 'GET', null, userToken)
        // if (recruitmentEndDateResponse) {
        //     let recruitmentEndDate = recruitmentEndDateResponse["recruitment_end_date"]
        //     if (recruitmentEndDate) {
        //         recruitmentSchedule.forEach(step => step["endDate"] = recruitmentEndDate);
        //     }
        // }

        /* get recruitment payment data for application */
        const paymentInfoResponse = await serverApi.apiRequest(`/api/enrollments/${application_id}/fees/`, 'GET', null, userToken);
        const paymentData = !paymentInfoResponse.error && Array.isArray(paymentInfoResponse.data)
            ? paymentInfoResponse.data
            : [];

        const paymentIsCompleted = paymentData.length === 0 || Boolean(paymentData[0]?.paid_date);
        if (paymentIsCompleted) {
            recruitmentSchedule[1].endDate = formatDateInWarsaw(paymentData[0]?.paid_date) || recruitmentEndDate;
            recruitmentSchedule[1].flag = "complete";
        }

        /* get recruitment document data for application */
        const documentInfoResponse = await serverApi.apiRequest(`/api/enrollments/${application_id}/documents/`, 'GET', null, userToken);
        const documentData = !documentInfoResponse.error && Array.isArray(documentInfoResponse.data)
            ? documentInfoResponse.data
            : [];
        const documentsCompleted = documentData.length === 0 || Boolean(documentData[0]?.status == "ACCEPTED");

        if (documentsCompleted) {
            recruitmentSchedule[2].endDate = formatDateInWarsaw(documentData[0]?.submitted_date) || recruitmentEndDate;
            recruitmentSchedule[2].flag = "complete";
        }

        /* ustaw decyzje komisji */
        if (paymentIsCompleted && documentsCompleted) {
            recruitmentSchedule[3].flag = 'in-progress'
            recruitmentSchedule[3].endDate = recruitmentSchedule[2].endDate
        }
        if (candidateStatus == 'STUDENT') {
            recruitmentSchedule[3].flag = 'complete'
            recruitmentSchedule[3].endDate = recruitmentSchedule[2].endDate
        }

        return recruitmentSchedule;
    }

    static async getAdminEnrollments(token) {
        return this.#getAdminEnrollmentsFromApi(token, false);
    }

    static async getAdminUnpaidEnrollments(token) {
        return this.#getAdminEnrollmentsFromApi(token, true);
    }

    static async sendPaymentReminder(token, enrollmentId) {
        const endpoints = [
            `/api/admin/enrollments/${enrollmentId}/send-payment-reminder/`,
            `/admin/enrollments/${enrollmentId}/send-payment-reminder/`,
        ];
        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'POST', {}, token);
            if (!res.error) {
                return {data: res.data, error: false, errorMsg: ''};
            }
        }
        return {data: null, error: true, errorMsg: 'Nie udało się wysłać przypomnienia.'};
    }

    static async getAdminEnrollmentDetails(token, enrollmentId) {
        const detailEndpoints = [
            `/api/admin/enrollments/${enrollmentId}/details/`,
            `/api/admin/enrollments/${enrollmentId}/`,
            `/admin/enrollments/${enrollmentId}/details/`,
            `/admin/enrollments/${enrollmentId}/`,
        ];
        const documentsEndpoints = [
            `/api/admin/enrollments/${enrollmentId}/documents/`,
            `/admin/enrollments/${enrollmentId}/documents/`,
        ];
        const feesEndpoints = [
            `/api/admin/enrollments/${enrollmentId}/fees/`,
            `/admin/enrollments/${enrollmentId}/fees/`,
        ];

        const detailResult = await this.#getFirstSuccessfulRequest(detailEndpoints, token);
        const documentsResult = await this.#getFirstSuccessfulRequest(documentsEndpoints, token);
        const feesResult = await this.#getFirstSuccessfulRequest(feesEndpoints, token);

        if (!detailResult.error) {
            const normalized = this.#normalizeAdminEnrollmentDetails(
                detailResult.data,
                documentsResult.error ? [] : documentsResult.data,
                feesResult.error ? [] : feesResult.data,
            );

            if (normalized) {
                return {enrollment: normalized, error: false, errorMsg: '', isMock: false};
            }
        }

        if (!token) {
            const mock = getMockAdminEnrollmentDetails(enrollmentId);
            if (mock) {
                return {enrollment: mock, error: false, errorMsg: '', isMock: true};
            }
        }

        if (!detailResult.error && detailResult.data) {
            return {
                enrollment: this.#buildEmptyAdminEnrollmentDetails(detailResult.data),
                error: false,
                errorMsg: '',
                isMock: false,
            };
        }

        return {
            enrollment: null,
            error: true,
            errorMsg: 'Nie udało się pobrać szczegółów zgłoszenia. Sprawdź uprawnienia konta i działanie endpointów admin.',
            isMock: false,
        };
    }

    static async reviewAdminEnrollment(token, enrollmentId, decision, statusNote = '') {
        const decisionEndpoints = [
            {endpoint: `/api/admin/enrollments/${enrollmentId}/${decision}/`, body: {status_note: statusNote}},
            {endpoint: `/admin/enrollments/${enrollmentId}/${decision}/`, body: {status_note: statusNote}},
            {endpoint: `/api/admin/enrollments/${enrollmentId}/decision/`, body: {decision, status_note: statusNote}},
            {endpoint: `/admin/enrollments/${enrollmentId}/decision/`, body: {decision, status_note: statusNote}},
        ];

        for (const candidate of decisionEndpoints) {
            const response = await this.apiRequest(candidate.endpoint, 'POST', candidate.body, token);
            if (!response.error) {
                const detailResponse = await this.getAdminEnrollmentDetails(token, enrollmentId);
                return {
                    enrollment: detailResponse.enrollment,
                    error: false,
                    errorMsg: '',
                    isMock: false,
                };
            }
        }

        if (!token) {
            const mock = saveMockAdminEnrollmentDecision(enrollmentId, decision, statusNote);
            return {
                enrollment: mock,
                error: false,
                errorMsg: '',
                isMock: true,
            };
        }

        return {
            enrollment: null,
            error: true,
            errorMsg: 'Nie udało się zapisać decyzji. Sprawdź uprawnienia konta i endpointy admin.',
            isMock: false,
        };
    }

    static async #getAdminEnrollmentsFromApi(token, unpaidOnly = false) {
        const suffix = unpaidOnly ? '?unpaid_only=true' : '';
        const endpoints = [
            `/api/admin/enrollments/${suffix}`,
            `/admin/enrollments/${suffix}`,
        ];

        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'GET', null, token);
            if (!res.error) {
                return {enrollments: res.data || [], error: false, errorMsg: '', isMock: false};
            }
        }

        if (!token) {
            return {
                enrollments: getMockAdminEnrollmentList({unpaidOnly}),
                error: false,
                errorMsg: '',
                isMock: true,
            };
        }

        return {
            enrollments: [],
            error: true,
            errorMsg: 'Nie udało się pobrać kandydatów. Sprawdź uprawnienia konta i endpointy admin.',
            isMock: false,
        };
    }

    static async #getFirstSuccessfulRequest(endpoints, token) {
        for (const endpoint of endpoints) {
            const response = await this.apiRequest(endpoint, 'GET', null, token);
            if (!response.error) {
                return response;
            }
        }

        return {data: null, error: true, errorMsg: 'Request failed'};
    }

    static async acceptDocument(token, enrollmentId, documentId, note = '') {
        const endpoints = [
            `/api/admin/enrollments/${enrollmentId}/documents/${documentId}/accept/`,
            `/admin/enrollments/${enrollmentId}/documents/${documentId}/accept/`,
        ];

        const body = note ? {note} : {};

        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'POST', body, token);
            if (!res.error) {
                return {data: res.data, error: false, errorMsg: ''};
            }
        }

        return {data: null, error: true, errorMsg: 'Nie udało się zaakceptować dokumentu.'};
    }

    static async rejectDocument(token, enrollmentId, documentId, note = '') {
        const endpoints = [
            `/api/admin/enrollments/${enrollmentId}/documents/${documentId}/reject/`,
            `/admin/enrollments/${enrollmentId}/documents/${documentId}/reject/`,
        ];

        const body = note ? {note} : {};

        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'POST', body, token);
            if (!res.error) {
                return {data: res.data, error: false, errorMsg: ''};
            }
        }

        return {data: null, error: true, errorMsg: 'Nie udało się odrzucić dokumentu.'};
    }

    /* Getting documents per enrollment from server */
    static async getAllEnrollmentDocuments(enrollmentId) {
        let token = getAccessToken()
        let documentsResponse = await this.apiRequest(`/api/enrollments/${enrollmentId}/documents/`, 'GET', null, token)

        let anyResponseError = documentsResponse == null || documentsResponse.error
        let anyResponseErrorMsg = documentsResponse ? documentsResponse.errorMsg : ""

        // get document for all active user enrollments
        if (!anyResponseError) {
            const mapped = documentsResponse.data.map(doc => ({ // go thru each document for enrollment
                title: doc.studies_document.name,
                dateUpload: doc.submitted_date,
                file: doc.file,
                status: doc.status,
                dateDeadline: doc.studies_document.due_date,
            }))

            return {documents: mapped, error: false, errorMsg: ""}
        }

        // if any db call returned error - return mock data
        if (anyResponseError) {
            const mockDocuments = [
                // SYSTEMOWE (Do wydruku)
                {
                    title: "Podanie o przyjęcie na studia",
                    studies_name: 'Nieznany Kierunek',
                    edition_name: 'edycja',
                    dateUpload: "10.03.2025",
                    file: 0,
                    actionRequired: true,
                    dateDeadline: "01.06.2025",
                    dateAccepted: "01.06.2025",
                },
                {
                    title: "Podanie o przyjęcie na studia",
                    studies_name: 'Nieznany Kierunek',
                    edition_name: 'edycja',
                    dateUpload: "10.03.2025",
                    file: 0,
                    actionRequired: false,
                    dateDeadline: "01.06.2025",
                    dateAccepted: "01.06.2025",
                },
            ];

            return {
                documents: mockDocuments,
                error: true,
                errorMsg: `Brak komunikacji z serwerem: Wyswietlane dane mock-owe (${anyResponseErrorMsg})`
            };
        }
    }

    static async downloadFile(fileId, token) {
        if (!fileId) {
            return {
                error: true,
                errorMsg: "Missing file id",
                errorDetail: "fileId is required",
            };
        }

        const result = await this.apiRequest(
            `/api/files/${fileId}/`,
            'GET',
            null,
            token,
            true,
            true
        );

        if (result.error) {
            return {
                error: true,
                errorMsg: result.errorMsg || 'Failed to download file',
                errorDetail: result.errorDetail || null,
            };
        }

        const blob = await result.data.blob();

        const contentDisposition = result.data.headers.get('Content-Disposition');
        let filename = 'file';
        if (contentDisposition) {
            let match = contentDisposition.match(/filename="?([^"]+)"?/);

            if (!match) {
                match = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/);
            }

            if (match) {
                filename = decodeURIComponent(match[1].replace(/['"]/g, ''));
            }
        }

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);

        return {
            error: false,
        };
    }

}