
export class serverApi {
    static getUserData() {
        return null
    }   
    static sendApplicationForm(applicationForm) {
        return null
    } 
    static getCourseInfo(editionId) {
        return null
    }

    /* Applications */
    // dane: application { name: "", type: "", status: [""],  schedule: [title: "", startDate: "", endDate: "", flag: ""] }
    static getUserUnfinishedApplications(userToken) {
        return [
            { name: "Niewypełniony wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje wypełnienia"], 
            schedule: [ { title: "Wypełnienie wniosku",  startDate: "2000-01-01", endDate: "2000-01-01", flag: "in-progress"} ] }
        ]
    }
    static getUserActiveApplications(userToken) {
        const tmpSchedule = [
            { title: "SKŁADANIE WNIOSKÓW", startDate: "2026-01-01", endDate: "2026-01-31", flag: "complete" },
            { title: "OPŁATA REKRUTACYJNA", startDate: "2026-02-01", endDate: "2026-04-30", flag: "in-progress" },
            { title: "DECYZJA KOMISJI", startDate: "2026-05-05", endDate: "2026-05-10", flag: "upcoming" }
        ]

        return [
            { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Oczekuje odpowiedźi"], schedule: tmpSchedule, id: 1 },
            { name: "Wniosek rekrutacyjny", type: "rekr", status: ["Brak zapłaty"], schedule: tmpSchedule, id: 2 }
        ]
    }
    static getApplicationDataFromId (id) {
        return {major: "Nieznany kierunek", institute: "Nieznany wydział"}
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
        return [
            { id: 1, name: "Czesne (Semestr Zimowy)", status: "Oczekuje", amount: "3,200.00 PLN", date: "15.10.2023", type: "pending" },
            { id: 2, name: "Wpisowe", status: "Zaległe", amount: "250.00 PLN", date: "30.09.2023", type: "overdue" }
        ];
    }
    static getUserPaymentsHistory() {
        return [
            { id: 101, name: "Czesne (Semestr Letni)", transId: "#INF-992831", date: "12.06.2023", amount: "3,200.00 PLN", status: "Zaksięgowano" },
            { id: 102, name: "Opłata za legitymację", transId: "#INF-981240", date: "01.06.2023", amount: "22.00 PLN", status: "Zaksięgowano" },
            { id: 103, name: "Ubezpieczenie", transId: "#INF-980112", date: "15.05.2023", amount: "55.00 PLN", status: "Zaksięgowano" }
        ];
    }
}