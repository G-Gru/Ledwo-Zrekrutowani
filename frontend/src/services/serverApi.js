
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
}