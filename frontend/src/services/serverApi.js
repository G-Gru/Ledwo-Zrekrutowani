
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

            if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
            
            const data = await response.json();
            return { data, error: false, errorMsg: "" };
        } catch (err) {
            console.error(`API Error (${endpoint}):`, err);
            return { data: null, error: true, errorMsg: err.message };
        }
    }

    static getUserData() {
        return null
    }   
    static sendApplicationForm(applicationForm) {
        return null
    } 
    static getCourseInfo(editionId) {
        return {major: "Nieznany kierunek", institute: "Nieznany wydział"}
    }

    /* Applications */
    // dane: application { name: "", type: "", status: [""],  schedule: [title: "", startDate: "", endDate: "", flag: ""] }
    static getUserUnfinishedApplications(userToken) {
        return {
            applications: [
                { name: "Niewypełniony wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje wypełnienia"], 
                schedule: this.generateRecruitmentApplicationSchedule(null, null, false) }
            ],
            error: true,
            errorMsg: "Pobieranie roboczych wniosków: Błąd komunikacji z serwerem, wyświetlane dane mock-owe."
        }
    }
    static getUserActiveApplications(userToken) {
        const tmpSchedule = [
            { title: "SKŁADANIE WNIOSKÓW", startDate: "2026-01-01", endDate: "2026-01-31", flag: "complete" },
            { title: "OPŁATA REKRUTACYJNA", startDate: "2026-02-01", endDate: "2026-04-30", flag: "in-progress" },
            { title: "DECYZJA KOMISJI", startDate: "2026-05-05", endDate: "2026-05-10", flag: "upcoming" }
        ]
        
        return {
            applications: [
                { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje odpowiedźi"], schedule: tmpSchedule, id: 1 },
                { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Brak zapłaty"], schedule: tmpSchedule, id: 2 }
            ],
            error: true,
            errorMsg: "Błąd komunikacji z serwerem, wyświetlane dane mock-owe."
        }
    }
    static async getUserActiveApplications(token) {
        
        const res = await this.apiRequest('/enrollments/', 'GET', null, token); // wylaczone na razie
        
        if (res.error) {
            /* mockowe dane */
            return {
                applications: [
                    { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje odpowiedźi"], schedule: this.generateRecruitmentApplicationSchedule(), id: 1 },
                    { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Brak zapłaty"], schedule: this.generateRecruitmentApplicationSchedule(), id: 2 }
                ],
                error: true,
                errorMsg: "Pobieranie aktywnych wniosków: Błąd komunikacji z serwerem, wyświetlane dane mock-owe."
            }
        }

        // Mapowanie danych z backendu na format frontendowy
        const mapped = res.data.map(item => ({
            id: item.id,
            studies_edition: item.studies_edition,
            name: "Wniosek rekrutacyjny",
            type: "rekr",
            status: [item.status],
            schedule: generateRecruitmentApplicationSchedule(token, item.id)
        }))
        return { applications: mapped, error: false, errorMsg: "" }
    }

    /* Payments */
    static getUserPaymentsSummary() {
        return {
            totalToPay: "3,450.00 PLN",
            deadline: "15.10.2023",
            nextPaymentName: "Czesne (Semestr Zimowy)"
        };
    }

    static getUserActivePayments() {
        let mock_data = [
            { id: 1, name: "Czesne (Semestr Zimowy)", status: "Oczekuje", amount: "3,200.00 PLN", date: "15.10.2023", type: "pending" },
            { id: 2, name: "Wpisowe", status: "Zaległe", amount: "250.00 PLN", date: "30.09.2023", type: "overdue" }
        ];
        return mock_data;
    }
    static getUserPaymentsHistory() {
        let mock_data = [
            { id: 101, name: "Czesne (Semestr Letni)", transId: "#INF-992831", date: "12.06.2023", amount: "3,200.00 PLN", status: "Zaksięgowano" },
            { id: 102, name: "Opłata za legitymację", transId: "#INF-981240", date: "01.06.2023", amount: "22.00 PLN", status: "Zaksięgowano" },
            { id: 103, name: "Ubezpieczenie", transId: "#INF-980112", date: "15.05.2023", amount: "55.00 PLN", status: "Zaksięgowano" }
        ];
        return mock_data;
    }

    static generateRecruitmentApplicationSchedule(userToken = null, application_id = null, isActive = true) {
        
        /* general recruit schedule */
        const recruitmentSchedule = [
            { title: "SKŁADANIE WNIOSKÓW", startDate: "--/--/--", endDate: "--/--/--", flag: isActive ? "complete" : "in-progress" },
            { title: "OPŁATA REKRUTACYJNA", startDate: "--/--/--", endDate: "--/--/--", flag: isActive ? "in-progress" : "upcoming" },
            { title: "PRZYNIESIENIE DOKUMENTÓW", startDate: "--/--/--", endDate: "--/--/--", flag: isActive ? "in-progress" : "upcoming" },
            { title: "DECYZJA KOMISJI", startDate: "--/--/--", endDate: "--/--/--", flag: "upcoming" }
        ]

        // if (userToken == null || application_id == null) return recruitmentSchedule;

        // /* set recruitment end date for all steps */
        // recruitmentEndDateResponse = serverApi.apiRequest(`/api/enrollment/${application_id}/recruitment_end_date`, 'GET', null, userToken)
        // if (recruitmentEndDateResponse) {
        //     let recruitmentEndDate = recruitmentEndDateResponse["recruitment_end_date"]
        //     if (recruitmentEndDate) {
        //         recruitmentSchedule.forEach(step => step["endDate"] = recruitmentEndDate);
        //     }
        // }
        
        // /* get recruitment payment data for application*/
        // paymentInfoResponse = serverApi.apiRequest(`/api/enrollments/${application_id}/fees`, 'GET', null, userToken)
        // if (paymentInfoResponse){
        //     let recruitmentPaymentDate = paymentInfoResponse[0]["paid_date"] // tutaj zakladam ze oplata rekrutacyjna bedzie pierwsza w liscie, mam nadzieje ze tak bedzie lol
        //     if (recruitmentPaymentDate) {
        //         recruitmentSchedule[1]["endDate"] = recruitmentPaymentDate
        //         recruitmentSchedule[1]["flag"] = "complete"
        //     }
        // }

        return recruitmentSchedule;
    }
}