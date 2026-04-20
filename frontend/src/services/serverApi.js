
import { getUser } from './authService';
import {
    getMockAdminEnrollmentDetails,
    getMockAdminEnrollmentList,
    saveMockAdminEnrollmentDecision,
} from '../mocks/adminEnrollmentMocks';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class serverApi {
    // Pomocnicza metoda do zapytań
    static async apiRequest(endpoint, method = 'GET', body = null, token = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
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
                return { data: null, error: true, errorMsg: `HTTP ${response.status}`, errorDetail };
            }
            
            const data = await response.json();
            return { data, error: false, errorMsg: "" };
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
            return { data: null, error: true, errorMsg: err.message, errorDetail: err.detail };
        }
    }

    static getUserData() {
        const user = getUser();
        if (user) {
            return {
                firstName: user.firstName || user.name || "Imie",
                lastName: user.lastName || "Nazwisko",
                email: user.email || "ziomeczek@mail.com"
            };
        }
        return { firstName: "Imie", lastName: "Nazwisko", email: "ziomeczek@mail.com" };
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
            index_number: summary.index_number || '',
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

        const normalized = this.#buildEmptyAdminEnrollmentDetails({
            id: detailData.id,
            student_name: detailData.student_name,
            status: detailData.status,
            index_number: detailData.index_number,
            status_note: detailData.status_note,
            enrollment_date: detailData.enrollment_date,
            is_fully_paid: detailData.is_fully_paid,
            missing_documents: detailData.missing_documents,
            system_status: detailData.system_status,
            studies_name: detailData.studies_name || detailData.studies_edition?.name,
            edition_name: detailData.edition_name || detailData.studies_edition?.name,
        });

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
   
    static async sendApplicationForm(token, applicationForm) {
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
            return { ...placeholderAddress };
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
                return { error: false, id: matches[0].id };
            }
            return { error: false, id: null };
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
            return { error: false, id: res.data.id };
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

        const formFullData = {
            action: applicationForm.action || 'SAVE',
            first_name: applicationForm.formData.firstName || 'Brak danych',
            second_name: applicationForm.formData.secondName || '',
            last_name: applicationForm.formData.lastName || 'Brak danych',
            family_name: applicationForm.formData.familyName || applicationForm.formData.lastName || 'Brak danych',
            academic_title: applicationForm.formData.title || 'Brak danych',
            birth_place: applicationForm.formData.birthplace || 'Brak danych',
            birth_date: applicationForm.formData.birthdate || '1900-01-01',
            pesel: applicationForm.formData.pesel || '00000000000',
            citizenship: applicationForm.formData.nationality || 'Polska',
            residential_address: residenceAddressId,
            registered_address: correspondenceAddressId,
            email: applicationForm.formData.email || 'brak@example.com',
            phone: applicationForm.formData.phone || '000000000',
            education: `${applicationForm.formData.studiesName || 'Brak danych'} w ${applicationForm.formData.studiesLocation || 'Brak danych'}, ukończono ${applicationForm.formData.studiesEndYear || '0000'}`,
            education_country: applicationForm.formData.education_country || 'Polska',
            emergency_contact: `${applicationForm.formData.emergencyContact?.name || 'Brak'} ${applicationForm.formData.emergencyContact?.surname || 'danych'} | tel:${applicationForm.formData.emergencyContact?.phone || '000000000'}`
        };

        const result = await this.apiRequest(`/api/enrollments/editions/${applicationForm.studies_edition_id}/`, 'POST', formFullData, token);
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

    static async getCourseInfo(editionId) {
        const res = await this.apiRequest('/api/studies/editions/', 'GET');
        if (!res.error) {
            const edition = res.data.find(item => item.id == editionId);
            if (edition) return { major: edition.name, institute: "Nieznany wydział" };
        }
        return { major: "Nieznany kierunek", institute: "Nieznany wydział" };
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
        let mock_schedule = await this.generateRecruitmentApplicationSchedule(null, null, false)
        return {
            applications: [
                { name: "Niewypełniony wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje wypełnienia"], 
                schedule: mock_schedule }
            ],
            error: true,
            errorMsg: "Pobieranie roboczych wniosków: Funkcjonalnosc niezaimplementowana: wyświetlane dane mock-owe."
        }
    }
    static async getUserActiveApplications(token) {
        
        const res = await this.apiRequest('/api/enrollments/active/', 'GET', null, token);
        
        if (res.error) {
            /* mockowe dane */
            return {
                applications: [
                    { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje odpowiedźi"], schedule: this.generateRecruitmentApplicationSchedule(), id: 1 },
                    { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Brak zapłaty"], schedule: this.generateRecruitmentApplicationSchedule(), id: 2 }
                ],
                error: true,
                errorMsg: `Pobieranie aktywnych wniosków: Błąd komunikacji z serwerem. Wyświetlane dane mock-owe (${res.errorMsg})`
            }
        }

        // Mapowanie danych z backendu na format frontendowy
        const mapped = await Promise.all(res.data.map(async item => ({
            id: item.id,
            studies_edition: item.studies_edition,
            name: "Wniosek rekrutacyjny",
            type: "rekr",
            status: [item.status],
            schedule: await serverApi.generateRecruitmentApplicationSchedule(token, item.id, true, item.recruitmentEndDate)
        })))
        return { applications: mapped, error: false, errorMsg: "" }
    }

    /* Payments */
    static async getUserActivePayments(token) {
        let paymentsResponse = await serverApi.apiRequest('/api/payments/upcoming/', 'GET', null, token)
        
        if (paymentsResponse.error) {
            let mock_data = [
                { id: 1, name: "Czesne (Semestr Zimowy)", status: "Oczekuje", amount: "3,200.00 PLN", date: "15.10.2023", type: "pending" },
                { id: 2, name: "Wpisowe", status: "Zaległe", amount: "250.00 PLN", date: "30.09.2023", type: "overdue" }
            ];
            return {
                payments: mock_data, error: true, errorMsg: `Pobieranie nadchodzących płatności: bład komunikacji z serwerem, wyświetlane dane mock-owe. ${paymentsResponse.errorMsg}`
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
        return { payments: mapped, error: false, errorMsg: "" }
    }
    static async getUserPaymentsHistory(token) {
        
        let paymentsResponse = await serverApi.apiRequest('/api/payments/history/', 'GET', null, token)
        
        if (paymentsResponse.error) {
            let mock_data = [
                { id: 101, title: "Czesne (Semestr Letni)", paid_date: "12.06.2023", amount: "3,200.00 PLN", status: "Zaksięgowano" },
                { id: 102, title: "Opłata za legitymację", paid_date: "01.06.2023", amount: "22.00 PLN", status: "Zaksięgowano" },
                { id: 103, title: "Ubezpieczenie", paid_date: "15.05.2023", amount: "55.00 PLN", status: "Zaksięgowano" }
            ];
            return {
                payments: mock_data, error: true, errorMsg: `Pobieranie historii płatności: bład komunikacji z serwerem, wyświetlane dane mock-owe. ${paymentsResponse.errorMsg}`
            }
        }
        
        const mapped = paymentsResponse.data.map(item => ({
            id: item.id,
            title: item.title,
            amount: item.amount + " PLN",
            paid_date: item.paid_date,
            status: "Zaksięgowano" // na raize wszytkie takie
        }))
        return { payments: mapped, error: false, errorMsg: "" }

    }
    static async userPayment(token, paymentIds) {
        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return { success: false, errorMsg: "Brak ID płatności do opłacenia." };
        }

        const results = [];
        for (const feePk of paymentIds) {
            const res = await serverApi.apiRequest(`/api/payments/${feePk}/pay/`, 'POST', null, token);
            results.push({ id: feePk, success: !res.error, errorMsg: res.error ? res.errorMsg : "" });
        }

        const failed = results.filter(r => !r.success);
        if (failed.length > 0) {
            return { success: false, errorMsg: `Błąd podczas opłacania płatności: ${failed[0].errorMsg}` };
        }

        return { success: true, errorMsg: "" };
    }

    /* HELPER schedule generator for applications */
    static async generateRecruitmentApplicationSchedule(userToken = null, application_id = null, isActive = true, recruitmentEndDate = "--/--/----") {
        
        /* general recruit schedule */
        const recruitmentSchedule = [
            { title: "SKŁADANIE WNIOSKÓW", startDate: "--/--/--", endDate: recruitmentEndDate, flag: isActive ? "complete" : "in-progress" },
            { title: "OPŁATA REKRUTACYJNA", startDate: "--/--/--", endDate: recruitmentEndDate, flag: isActive ? "in-progress" : "upcoming" },
            { title: "PRZYNIESIENIE DOKUMENTÓW", startDate: "--/--/--", endDate: recruitmentEndDate, flag: isActive ? "in-progress" : "upcoming" },
            { title: "DECYZJA KOMISJI", startDate: "--/--/--", endDate: recruitmentEndDate, flag: "upcoming" }
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
            recruitmentSchedule[1].endDate = paymentData[0]?.paid_date || recruitmentEndDate;
            recruitmentSchedule[1].flag = "complete";
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
            `/admin/enrollments/${enrollmentId}/send-payment-reminder/`,
            `/api/admin/enrollments/${enrollmentId}/send-payment-reminder/`,
        ];
        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'POST', {}, token);
            if (!res.error) {
                return { data: res.data, error: false, errorMsg: '' };
            }
        }
        return { data: null, error: true, errorMsg: 'Nie udało się wysłać przypomnienia.' };
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
                return { enrollment: normalized, error: false, errorMsg: '', isMock: false };
            }
        }

        const mock = getMockAdminEnrollmentDetails(enrollmentId);
        if (mock) {
            return { enrollment: mock, error: false, errorMsg: '', isMock: true };
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
            errorMsg: 'Nie udało się pobrać szczegółów zgłoszenia.',
            isMock: false,
        };
    }

    static async reviewAdminEnrollment(token, enrollmentId, decision, statusNote = '') {
        const decisionEndpoints = [
            { endpoint: `/api/admin/enrollments/${enrollmentId}/${decision}/`, body: { status_note: statusNote } },
            { endpoint: `/admin/enrollments/${enrollmentId}/${decision}/`, body: { status_note: statusNote } },
            { endpoint: `/api/admin/enrollments/${enrollmentId}/decision/`, body: { decision, status_note: statusNote } },
            { endpoint: `/admin/enrollments/${enrollmentId}/decision/`, body: { decision, status_note: statusNote } },
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

        const mock = saveMockAdminEnrollmentDecision(enrollmentId, decision, statusNote);
        return {
            enrollment: mock,
            error: false,
            errorMsg: '',
            isMock: true,
        };
    }

    static async #getAdminEnrollmentsFromApi(token, unpaidOnly = false) {
        const suffix = unpaidOnly ? '?unpaid_only=true' : '';
        const endpoints = [
            `/admin/enrollments/${suffix}`,
            `/api/admin/enrollments/${suffix}`,
        ];

        for (const endpoint of endpoints) {
            const res = await this.apiRequest(endpoint, 'GET', null, token);
            if (!res.error) {
                return { enrollments: res.data || [], error: false, errorMsg: '', isMock: false };
            }
        }

        return {
            enrollments: getMockAdminEnrollmentList({ unpaidOnly }),
            error: false,
            errorMsg: '',
            isMock: true,
        };
    }

    static async #getFirstSuccessfulRequest(endpoints, token) {
        for (const endpoint of endpoints) {
            const response = await this.apiRequest(endpoint, 'GET', null, token);
            if (!response.error) {
                return response;
            }
        }

        return { data: null, error: true, errorMsg: 'Request failed' };
    }

    static async setIndexNumber(token, enrollmentId, indexNumber) {
        return await this.apiRequest(
            `/api/admin/enrollments/${enrollmentId}/set-index/`, 
            'POST', 
            { index_number: indexNumber }, 
            token
        );
    }
}