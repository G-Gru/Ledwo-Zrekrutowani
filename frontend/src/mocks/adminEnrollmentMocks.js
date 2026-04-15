const STORAGE_KEY = 'admin-enrollment-review-overrides';

const BASE_MOCK_ENROLLMENTS = [
  {
    id: 101,
    student_name: 'Jan Kowalski',
    status: 'W_TRAKCIE',
    status_note: 'Brakuje potwierdzenia opłaty rekrutacyjnej oraz podpisanego dyplomu.',
    enrollment_date: '2026-03-20',
    is_fully_paid: false,
    missing_documents: true,
    system_status: 'NIESPEŁNIONE WYMOGI (Brak opłat/dokumentów)',
    studies_name: 'Analityka danych w biznesie',
    edition_name: 'Edycja wiosna 2026',
    personal: {
      first_name: 'Jan',
      second_name: 'Marek',
      last_name: 'Kowalski',
      family_name: 'Kowalski',
      academic_title: 'inż.',
      birth_date: '1998-05-12',
      birth_place: 'Kraków',
      pesel: '98051212345',
      citizenship: 'Polska',
    },
    contact: {
      email: 'jan.kowalski@example.com',
      phone: '+48 501 222 333',
    },
    residential_address: {
      street: 'Karmelicka',
      house_number: '14',
      flat_number: '8',
      city: 'Kraków',
      country: 'Polska',
      postal_code: '31-133',
    },
    registered_address: {
      street: 'Karmelicka',
      house_number: '14',
      flat_number: '8',
      city: 'Kraków',
      country: 'Polska',
      postal_code: '31-133',
    },
    education: {
      description: 'Automatyka i robotyka, AGH w Krakowie, ukończono 2022',
      country: 'Polska',
    },
    emergency_contact: {
      name: 'Maria',
      surname: 'Kowalska',
      relation: 'matka',
      phone: '+48 600 700 800',
    },
    documents: [
      {
        id: 1,
        title: 'Dyplom ukończenia studiów',
        required: true,
        status: 'SUBMITTED',
        submitted_date: '2026-03-20T09:15:00',
        file_name: 'dyplom-jan-kowalski.pdf',
      },
      {
        id: 2,
        title: 'Dowód wniesienia opłaty rekrutacyjnej',
        required: true,
        status: 'REJECTED',
        submitted_date: '2026-03-20T09:17:00',
        file_name: 'oplata-jan-kowalski.pdf',
      },
      {
        id: 3,
        title: 'CV',
        required: false,
        status: 'ACCEPTED',
        submitted_date: '2026-03-20T09:20:00',
        file_name: 'cv-jan-kowalski.pdf',
      },
    ],
    fees: [
      {
        id: 5001,
        title: 'Opłata rekrutacyjna',
        amount: '85.00 PLN',
        due_date: '2026-03-25',
        paid_date: null,
        status: 'Nieopłacona',
      },
    ],
  },
  {
    id: 102,
    student_name: 'Anna Nowak',
    status: 'W_TRAKCIE',
    status_note: 'Komplet dokumentów. Kandydatka spełnia wymagania formalne.',
    enrollment_date: '2026-03-22',
    is_fully_paid: true,
    missing_documents: false,
    system_status: 'KOMPLETNE - GOTOWE DO DECYZJI',
    studies_name: 'Zarządzanie projektami IT',
    edition_name: 'Edycja lato 2026',
    personal: {
      first_name: 'Anna',
      second_name: '',
      last_name: 'Nowak',
      family_name: 'Nowak',
      academic_title: 'mgr',
      birth_date: '1994-11-03',
      birth_place: 'Warszawa',
      pesel: '94110354321',
      citizenship: 'Polska',
    },
    contact: {
      email: 'anna.nowak@example.com',
      phone: '+48 698 111 222',
    },
    residential_address: {
      street: 'Puławska',
      house_number: '120A',
      flat_number: '15',
      city: 'Warszawa',
      country: 'Polska',
      postal_code: '02-620',
    },
    registered_address: {
      street: 'Puławska',
      house_number: '120A',
      flat_number: '15',
      city: 'Warszawa',
      country: 'Polska',
      postal_code: '02-620',
    },
    education: {
      description: 'Informatyka, Politechnika Warszawska, ukończono 2018',
      country: 'Polska',
    },
    emergency_contact: {
      name: 'Tomasz',
      surname: 'Nowak',
      relation: 'mąż',
      phone: '+48 503 404 505',
    },
    documents: [
      {
        id: 4,
        title: 'Dyplom ukończenia studiów',
        required: true,
        status: 'ACCEPTED',
        submitted_date: '2026-03-22T12:10:00',
        file_name: 'dyplom-anna-nowak.pdf',
      },
      {
        id: 5,
        title: 'Dowód wniesienia opłaty rekrutacyjnej',
        required: true,
        status: 'ACCEPTED',
        submitted_date: '2026-03-22T12:12:00',
        file_name: 'oplata-anna-nowak.pdf',
      },
      {
        id: 6,
        title: 'List motywacyjny',
        required: false,
        status: 'VERIFIED',
        submitted_date: '2026-03-22T12:16:00',
        file_name: 'list-motywacyjny-anna-nowak.pdf',
      },
    ],
    fees: [
      {
        id: 5002,
        title: 'Opłata rekrutacyjna',
        amount: '85.00 PLN',
        due_date: '2026-03-28',
        paid_date: '2026-03-23',
        status: 'Opłacona',
      },
    ],
  },
  {
    id: 103,
    student_name: 'Piotr Zieliński',
    status: 'W_TRAKCIE',
    status_note: 'Dokumenty kompletne, oczekiwanie na weryfikację formalną.',
    enrollment_date: '2026-03-24',
    is_fully_paid: false,
    missing_documents: false,
    system_status: 'NIESPEŁNIONE WYMOGI (Brak opłat/dokumentów)',
    studies_name: 'Cyberbezpieczeństwo w organizacji',
    edition_name: 'Edycja jesień 2026',
    personal: {
      first_name: 'Piotr',
      second_name: 'Adam',
      last_name: 'Zieliński',
      family_name: 'Zieliński',
      academic_title: 'lic.',
      birth_date: '1999-01-18',
      birth_place: 'Rzeszów',
      pesel: '99011877889',
      citizenship: 'Polska',
    },
    contact: {
      email: 'piotr.zielinski@example.com',
      phone: '+48 787 888 999',
    },
    residential_address: {
      street: 'Hetmańska',
      house_number: '52',
      flat_number: '3',
      city: 'Rzeszów',
      country: 'Polska',
      postal_code: '35-078',
    },
    registered_address: {
      street: 'Hetmańska',
      house_number: '52',
      flat_number: '3',
      city: 'Rzeszów',
      country: 'Polska',
      postal_code: '35-078',
    },
    education: {
      description: 'Bezpieczeństwo narodowe, Uniwersytet Rzeszowski, ukończono 2023',
      country: 'Polska',
    },
    emergency_contact: {
      name: 'Joanna',
      surname: 'Zielińska',
      relation: 'siostra',
      phone: '+48 515 616 717',
    },
    documents: [
      {
        id: 7,
        title: 'Dyplom ukończenia studiów',
        required: true,
        status: 'ACCEPTED',
        submitted_date: '2026-03-24T15:40:00',
        file_name: 'dyplom-piotr-zielinski.pdf',
      },
      {
        id: 8,
        title: 'Dowód wniesienia opłaty rekrutacyjnej',
        required: true,
        status: 'SUBMITTED',
        submitted_date: '2026-03-24T15:43:00',
        file_name: 'oplata-piotr-zielinski.pdf',
      },
    ],
    fees: [
      {
        id: 5003,
        title: 'Opłata rekrutacyjna',
        amount: '85.00 PLN',
        due_date: '2026-03-29',
        paid_date: null,
        status: 'W trakcie księgowania',
      },
    ],
  },
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getOverrides() {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverrides(overrides) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function applyOverride(item) {
  const overrides = getOverrides();
  const override = overrides[item.id];

  if (!override) {
    return item;
  }

  return {
    ...item,
    ...override,
  };
}

function toSummary(item) {
  return {
    id: item.id,
    student_name: item.student_name,
    status: item.status,
    status_note: item.status_note,
    enrollment_date: item.enrollment_date,
    is_fully_paid: item.is_fully_paid,
    missing_documents: item.missing_documents,
    system_status: item.system_status,
    studies_name: item.studies_name,
    edition_name: item.edition_name,
  };
}

export function getMockAdminEnrollmentList({ unpaidOnly = false } = {}) {
  const data = BASE_MOCK_ENROLLMENTS
    .map((item) => applyOverride(clone(item)))
    .filter((item) => (unpaidOnly ? !item.is_fully_paid : true))
    .map(toSummary);

  return data;
}

export function getMockAdminEnrollmentDetails(id) {
  const numericId = Number(id);
  const found = BASE_MOCK_ENROLLMENTS.find((item) => item.id === numericId);

  if (!found) {
    return null;
  }

  return applyOverride(clone(found));
}

export function saveMockAdminEnrollmentDecision(id, decision, statusNote) {
  const numericId = Number(id);
  const overrides = getOverrides();
  const nextStatus = decision === 'accept' ? 'ZAAKCEPTOWANE' : 'ODRZUCONE';
  const nextSystemStatus = decision === 'accept'
    ? 'DECYZJA POZYTYWNA - KANDYDAT GOTOWY DO KOLEJNEGO ETAPU'
    : 'DECYZJA NEGATYWNA - ZGŁOSZENIE ZAMKNIĘTE';

  overrides[numericId] = {
    ...(overrides[numericId] || {}),
    status: nextStatus,
    status_note: statusNote || '',
    system_status: nextSystemStatus,
    review_updated_at: new Date().toISOString(),
  };

  saveOverrides(overrides);
  return getMockAdminEnrollmentDetails(numericId);
}

export function getMockAdminEnrollmentPreviewId() {
  return BASE_MOCK_ENROLLMENTS[0]?.id || 1;
}