from datetime import date, timedelta

from django.core.management.base import BaseCommand

from enrollments.models import Enrollment, Address, FormData, SubmittedDocument, DocumentHistory
from payments.models import Fee, Payment, PaymentHistory
from studies.models import Studies, StudiesEdition, StudiesEditionStaff, StudiesDocument
from users.models import User, Employee, WorkPhoneNumber


class Command(BaseCommand):
    help = 'Creates rich aplication data'

    def handle(self, *args, **kwargs):
        today = date.today()

        # ── Czyszczenie bazy ────────────────────────────────────────────────
        PaymentHistory.objects.all().delete()
        Payment.objects.all().delete()
        Fee.objects.all().delete()
        DocumentHistory.objects.all().delete()
        SubmittedDocument.objects.all().delete()
        FormData.objects.all().delete()
        Enrollment.objects.all().delete()
        Address.objects.all().delete()
        WorkPhoneNumber.objects.all().delete()
        Employee.objects.all().delete()
        StudiesEditionStaff.objects.all().delete()
        StudiesDocument.objects.all().delete()
        StudiesEdition.objects.all().delete()
        Studies.objects.all().delete()
        User.objects.all().delete()

        # ── Users ──────────────────────────────────────────────────────────
        users_raw = [
            dict(email="admin@gmail.com", first_name="Adam", last_name="Nowak",
                 is_staff=True, is_superuser=True, is_employee=True, is_active=True),
            dict(email="finansowy@gmail.com", first_name="Felicja", last_name="Malinowska",
                 is_employee=True, is_active=True),
            dict(email="administracyjny@gmail.com", first_name="Andrzej", last_name="Kowalski",
                 is_employee=True, is_active=True),
            dict(email="kierownik@gmail.com", first_name="Katarzyna", last_name="Jabłońska",
                 is_employee=True, is_active=True),
            dict(email="anna.kowalska@gmail.com", first_name="Anna", last_name="Kowalska", is_active=True),
            dict(email="piotr.wisniewski@gmail.com", first_name="Piotr", last_name="Wiśniewski", is_active=True),
            dict(email="katarzyna.wojcik@gmail.com", first_name="Katarzyna", last_name="Wójcik", is_active=True),
            dict(email="michal.kowalczyk@gmail.com", first_name="Michał", last_name="Kowalczyk", is_active=True),
            dict(email="agnieszka.kaminska@gmail.com", first_name="Agnieszka", last_name="Kamińska", is_active=True),
            dict(email="tomasz.lewandowski@gmail.com", first_name="Tomasz", last_name="Lewandowski", is_active=True),
            dict(email="magdalena.zielinska@gmail.com", first_name="Magdalena", last_name="Zielińska", is_active=True),
            dict(email="krzysztof.szymanski@gmail.com", first_name="Krzysztof", last_name="Szymański", is_active=True),
            dict(email="joanna.wozniak@gmail.com", first_name="Joanna", last_name="Woźniak", is_active=True),
            dict(email="marcin.dabrowski@gmail.com", first_name="Marcin", last_name="Dąbrowski", is_active=True),
        ]
        user_objects = []
        for d in users_raw:
            u = User(**d)
            u.set_password('admin')
            user_objects.append(u)
        User.objects.bulk_create(user_objects)

        um = {u.email: u for u in User.objects.filter(email__in=[d['email'] for d in users_raw])}

        Employee.objects.bulk_create([
            Employee(user=um["admin@gmail.com"]),
            Employee(user=um["finansowy@gmail.com"]),
            Employee(user=um["administracyjny@gmail.com"]),
            Employee(user=um["kierownik@gmail.com"]),
        ])

        em = {e.user.email: e for e in Employee.objects.filter(user__email__in=[
            "admin@gmail.com", "finansowy@gmail.com", "administracyjny@gmail.com", "kierownik@gmail.com"
        ])}
        WorkPhoneNumber.objects.bulk_create([
            WorkPhoneNumber(employee=em["admin@gmail.com"], phone="100200300"),
            WorkPhoneNumber(employee=em["admin@gmail.com"], phone="100200301"),
            WorkPhoneNumber(employee=em["finansowy@gmail.com"], phone="100200302"),
            WorkPhoneNumber(employee=em["finansowy@gmail.com"], phone="100200303"),
            WorkPhoneNumber(employee=em["administracyjny@gmail.com"], phone="100200304"),
            WorkPhoneNumber(employee=em["kierownik@gmail.com"], phone="100200305"),
            WorkPhoneNumber(employee=em["kierownik@gmail.com"], phone="100200306"),
        ])

        finance = um["finansowy@gmail.com"]
        administrative = um["administracyjny@gmail.com"]
        director = um["kierownik@gmail.com"]

        students = [
            um["anna.kowalska@gmail.com"],
            um["piotr.wisniewski@gmail.com"],
            um["katarzyna.wojcik@gmail.com"],
            um["michal.kowalczyk@gmail.com"],
            um["agnieszka.kaminska@gmail.com"],
            um["tomasz.lewandowski@gmail.com"],
            um["magdalena.zielinska@gmail.com"],
            um["krzysztof.szymanski@gmail.com"],
            um["joanna.wozniak@gmail.com"],
            um["marcin.dabrowski@gmail.com"],
        ]

        # ── Studies ─────────────────────────────────────────────────────────
        Studies.objects.bulk_create([
            Studies(
                name="Bazy danych",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Studia podyplomowe z zakresu projektowania, administracji i optymalizacji relacyjnych "
                    "i nierelacyjnych baz danych. Program obejmuje SQL, NoSQL, modelowanie danych oraz "
                    "zarządzanie wydajnością systemów bazodanowych w środowiskach produkcyjnych."
                ),
            ),
            Studies(
                name="Systemy ERP",
                terms_count=2,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Kompleksowe szkolenie z wdrażania i obsługi systemów ERP klasy SAP, Oracle "
                    "i Microsoft Dynamics. Uczestnicy poznają procesy biznesowe, konfigurację modułów "
                    "oraz zarządzanie projektami wdrożeniowymi."
                ),
            ),
            Studies(
                name="Zarządzanie Projektami IT",
                terms_count=2,
                organizational_unit="Wydział Zarządzania",
                description=(
                    "Program dedykowany kierownikom projektów i liderom zespołów technicznych. "
                    "Obejmuje metodyki Agile, Scrum, Prince2 oraz PMI. Słuchacze przygotowują się "
                    "do egzaminów certyfikacyjnych PMP i PSM."
                ),
            ),
            Studies(
                name="Cyberbezpieczeństwo",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Studia łączące teorię i praktykę bezpieczeństwa informacji. Tematyka obejmuje "
                    "testy penetracyjne, analizę złośliwego oprogramowania, bezpieczeństwo sieci "
                    "i aplikacji webowych, kryptografię oraz zgodność z regulacjami (RODO, ISO 27001)."
                ),
            ),
            Studies(
                name="Data Science i Machine Learning",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Interdyscyplinarne studia łączące statystykę, programowanie w Pythonie oraz "
                    "algorytmy uczenia maszynowego. Program przygotowuje specjalistów zdolnych do "
                    "analizy dużych zbiorów danych, budowania modeli predykcyjnych i ich wdrażania "
                    "w środowiskach produkcyjnych."
                ),
            ),
        ])

        sm = {s.name: s for s in Studies.objects.all()}

        # ── StudiesEditions ────────────────────────────────────────────────
        # Constraints: end_date > start_date, recruitment_end < start_date,
        #              recruitment_end > recruitment_start, price >= 0
        StudiesEdition.objects.bulk_create([
            # Bazy Danych 2024/2025 — CLOSED (zakończona edycja)
            StudiesEdition(
                studies=sm["Bazy danych"], price=3500, max_participants=25,
                start_date=today - timedelta(days=200),
                end_date=today - timedelta(days=30),
                status='CLOSED',
                syllabus_url="https://example.com/syllabus/bd-2024",
                academic_year="2024/2025",
                recruitment_start_date=today - timedelta(days=280),
                recruitment_end_date=today - timedelta(days=210),
            ),
            # Bazy Danych 2025/2026 — ACTIVE (otwarta rekrutacja)
            StudiesEdition(
                studies=sm["Bazy danych"], price=3800, max_participants=20,
                start_date=today + timedelta(days=40),
                end_date=today + timedelta(days=280),
                status='ACTIVE',
                syllabus_url="https://example.com/syllabus/bd-2025",
                academic_year="2025/2026",
                recruitment_start_date=today - timedelta(days=14),
                recruitment_end_date=today + timedelta(days=20),
            ),
            # Systemy ERP 2025/2026 — ACTIVE
            StudiesEdition(
                studies=sm["Systemy ERP"], price=4200, max_participants=15,
                start_date=today + timedelta(days=30),
                end_date=today + timedelta(days=250),
                status='ACTIVE',
                syllabus_url="https://example.com/syllabus/erp-2025",
                academic_year="2025/2026",
                recruitment_start_date=today - timedelta(days=7),
                recruitment_end_date=today + timedelta(days=14),
            ),
            # Zarządzanie Projektami IT 2025/2026 — ACTIVE
            StudiesEdition(
                studies=sm["Zarządzanie Projektami IT"], price=3200, max_participants=30,
                start_date=today + timedelta(days=60),
                end_date=today + timedelta(days=300),
                status='ACTIVE',
                syllabus_url="https://example.com/syllabus/pm-2025",
                academic_year="2025/2026",
                recruitment_start_date=today - timedelta(days=5),
                recruitment_end_date=today + timedelta(days=30),
            ),
            # Cyberbezpieczeństwo 2025/2026 — HIDDEN (planowane)
            StudiesEdition(
                studies=sm["Cyberbezpieczeństwo"], price=5000, max_participants=20,
                start_date=today + timedelta(days=90),
                end_date=today + timedelta(days=360),
                status='HIDDEN',
                syllabus_url="https://example.com/syllabus/cyber-2025",
                academic_year="2025/2026",
                recruitment_start_date=today + timedelta(days=20),
                recruitment_end_date=today + timedelta(days=60),
            ),
            # Data Science 2025/2026 — ACTIVE
            StudiesEdition(
                studies=sm["Data Science i Machine Learning"], price=4800, max_participants=25,
                start_date=today + timedelta(days=45),
                end_date=today + timedelta(days=310),
                status='ACTIVE',
                syllabus_url="https://example.com/syllabus/ds-2025",
                academic_year="2025/2026",
                recruitment_start_date=today - timedelta(days=10),
                recruitment_end_date=today + timedelta(days=25),
            ),
        ])

        editions = list(StudiesEdition.objects.order_by('id'))
        # 0 = Bazy Danych CLOSED 2024/2025
        # 1 = Bazy Danych ACTIVE 2025/2026
        # 2 = Systemy ERP ACTIVE 2025/2026
        # 3 = Zarządzanie Projektami IT ACTIVE 2025/2026
        # 4 = Cyberbezpieczeństwo HIDDEN 2025/2026
        # 5 = Data Science ACTIVE 2025/2026

        # ── Staff ────────────────────────────────────────────────────────────
        staff_entries = []
        for edition in editions:
            staff_entries.append(StudiesEditionStaff(
                studies_edition=edition, user=director, role='STUDIES_DIRECTOR'))
            staff_entries.append(StudiesEditionStaff(
                studies_edition=edition, user=administrative, role='ADMINISTRATIVE_COORDINATOR'))
            staff_entries.append(StudiesEditionStaff(
                studies_edition=edition, user=finance, role='FINANCE_COORDINATOR'))
        StudiesEditionStaff.objects.bulk_create(staff_entries)

        # ── Documents (tylko dla edycji ACTIVE) ─────────────────────────────
        doc_entries = []
        for edition in editions:
            if edition.status == 'ACTIVE':
                doc_entries += [
                    StudiesDocument(
                        studies_edition=edition,
                        name="Kopia dyplomu ukończenia studiów wyższych",
                        required=True,
                        due_date=today + timedelta(days=30),
                    ),
                    StudiesDocument(
                        studies_edition=edition,
                        name="Zdjęcie legitymacyjne (format 35×45 mm)",
                        required=True,
                        due_date=today + timedelta(days=30),
                    ),
                    StudiesDocument(
                        studies_edition=edition,
                        name="Curriculum Vitae",
                        required=False,
                        due_date=today + timedelta(days=30),
                    ),
                ]
        StudiesDocument.objects.bulk_create(doc_entries)

        # ── Helpers ──────────────────────────────────────────────────────────
        def make_enrollment(user, edition, status, days_ago, fd):
            addr = Address.objects.create(
                user=user,
                street=fd['street'],
                house_number=fd['house_number'],
                city=fd['city'],
                country="Polska",
                postal_code=fd['postal_code'],
            )
            enr = Enrollment.objects.create(
                user=user,
                studies_edition=edition,
                status=status,
                enrollment_date=today - timedelta(days=days_ago),
            )
            FormData.objects.create(
                enrollment=enr,
                first_name=fd['first_name'],
                last_name=fd['last_name'],
                family_name=fd['family_name'],
                academic_title=fd['academic_title'],
                birth_date=fd['birth_date'],
                birth_place=fd['birth_place'],
                pesel=fd['pesel'],
                citizenship="polskie",
                residential_address=addr,
                registered_address=addr,
                email=user.email,
                phone=fd['phone'],
                education_university=fd['university'],
                education_year=fd['edu_year'],
                education_location=fd['edu_city'],
                maturity_country="Polska",
            )
            return enr

        def paid_fee(enr, amount, due_days, paid_days, ref):
            fee = Fee.objects.create(
                enrollment=enr,
                title=f"Opłata rekrutacyjna za {enr.studies_edition.studies.name}",
                amount=amount,
                due_date=today + timedelta(days=due_days),
                paid_date=today - timedelta(days=paid_days),
            )
            pmt = Payment.objects.create(
                fee=fee, payment_method="PRZELEW",
                reference_number=ref, status="COMPLETED",
            )
            PaymentHistory.objects.create(payment=pmt, previous_status=None, new_status="COMPLETED")

        def pending_fee(enr, amount, due_days, ref):
            fee = Fee.objects.create(
                enrollment=enr,
                title=f"Opłata rekrutacyjna za {enr.studies_edition.studies.name}",
                amount=amount,
                due_date=today + timedelta(days=due_days),
            )
            pmt = Payment.objects.create(
                fee=fee, payment_method="PRZELEW",
                reference_number=ref, status="PENDING",
            )
            PaymentHistory.objects.create(payment=pmt, previous_status=None, new_status="PENDING")

        # ── Enrollments ───────────────────────────────────────────────────────
        # Anna Kowalska — STUDENT, Bazy Danych ACTIVE
        e = make_enrollment(students[0], editions[1], Enrollment.Status.STUDENT, 10, dict(
            street="Marszałkowska", house_number="12", city="Warszawa", postal_code="00-001",
            first_name="Anna", last_name="Kowalska", family_name="Kowalska",
            academic_title="mgr", birth_date=date(1992, 3, 14), birth_place="Warszawa",
            pesel="92031412345", phone="501234567",
            university="Politechnika Warszawska", edu_year=2019, edu_city="Warszawa",
        ))
        paid_fee(e, 100, 14, 7, 1001)

        # Piotr Wiśniewski — STUDENT, Systemy ERP ACTIVE
        e = make_enrollment(students[1], editions[2], Enrollment.Status.STUDENT, 8, dict(
            street="Floriańska", house_number="5", city="Kraków", postal_code="31-019",
            first_name="Piotr", last_name="Wiśniewski", family_name="Wiśniewski",
            academic_title="mgr inż", birth_date=date(1988, 7, 22), birth_place="Kraków",
            pesel="88072212345", phone="502345678",
            university="AGH", edu_year=2015, edu_city="Kraków",
        ))
        paid_fee(e, 100, 10, 6, 1002)

        # Katarzyna Wójcik — CANDIDATE, Data Science ACTIVE
        e = make_enrollment(students[2], editions[5], Enrollment.Status.CANDIDATE, 3, dict(
            street="Świdnicka", house_number="20", city="Wrocław", postal_code="50-066",
            first_name="Katarzyna", last_name="Wójcik", family_name="Wójcik",
            academic_title="mgr", birth_date=date(1995, 11, 8), birth_place="Wrocław",
            pesel="95110812345", phone="503456789",
            university="Politechnika Wrocławska", edu_year=2022, edu_city="Wrocław",
        ))
        pending_fee(e, 100, 20, 1003)

        # Michał Kowalczyk — STUDENT, Zarządzanie Projektami IT ACTIVE
        e = make_enrollment(students[3], editions[3], Enrollment.Status.STUDENT, 12, dict(
            street="Półwiejska", house_number="8", city="Poznań", postal_code="61-888",
            first_name="Michał", last_name="Kowalczyk", family_name="Kowalczyk",
            academic_title="mgr", birth_date=date(1990, 5, 3), birth_place="Poznań",
            pesel="90050312345", phone="504567890",
            university="Uniwersytet im. Adama Mickiewicza", edu_year=2017, edu_city="Poznań",
        ))
        paid_fee(e, 100, 20, 10, 1004)

        # Agnieszka Kamińska — CANDIDATE, Bazy Danych ACTIVE
        e = make_enrollment(students[4], editions[1], Enrollment.Status.CANDIDATE, 5, dict(
            street="Piotrkowska", house_number="100", city="Łódź", postal_code="90-004",
            first_name="Agnieszka", last_name="Kamińska", family_name="Kamińska",
            academic_title="inż", birth_date=date(1997, 2, 19), birth_place="Łódź",
            pesel="97021912346", phone="505678901",
            university="Politechnika Łódzka", edu_year=2021, edu_city="Łódź",
        ))
        pending_fee(e, 100, 15, 1005)

        # Magdalena Zielińska — STUDENT, Systemy ERP ACTIVE
        e = make_enrollment(students[6], editions[2], Enrollment.Status.STUDENT, 9, dict(
            street="Katowicka", house_number="15", city="Katowice", postal_code="40-001",
            first_name="Magdalena", last_name="Zielińska", family_name="Zielińska",
            academic_title="mgr", birth_date=date(1991, 6, 25), birth_place="Katowice",
            pesel="91062512345", phone="507890123",
            university="Politechnika Śląska", edu_year=2016, edu_city="Gliwice",
        ))
        paid_fee(e, 100, 8, 8, 1007)

        # Krzysztof Szymański — EXPELLED, Bazy Danych CLOSED 2024/2025
        make_enrollment(students[7], editions[0], Enrollment.Status.EXPELLED, 200, dict(
            street="Lipowa", house_number="7", city="Białystok", postal_code="15-427",
            first_name="Krzysztof", last_name="Szymański", family_name="Szymański",
            academic_title="lic", birth_date=date(1993, 12, 1), birth_place="Białystok",
            pesel="93120112345", phone="508901234",
            university="Uniwersytet w Białymstoku", edu_year=2018, edu_city="Białystok",
        ))

        # Joanna Woźniak — STUDENT, Data Science ACTIVE
        e = make_enrollment(students[8], editions[5], Enrollment.Status.STUDENT, 11, dict(
            street="Nowy Świat", house_number="3", city="Warszawa", postal_code="00-497",
            first_name="Joanna", last_name="Woźniak", family_name="Woźniak",
            academic_title="mgr inż", birth_date=date(1989, 4, 17), birth_place="Warszawa",
            pesel="89041712345", phone="509012345",
            university="Politechnika Warszawska", edu_year=2014, edu_city="Warszawa",
        ))
        paid_fee(e, 100, 18, 9, 1008)

        # Marcin Dąbrowski — CANDIDATE, Zarządzanie Projektami IT ACTIVE
        e = make_enrollment(students[9], editions[3], Enrollment.Status.CANDIDATE, 2, dict(
            street="Krakowska", house_number="22", city="Kraków", postal_code="31-062",
            first_name="Marcin", last_name="Dąbrowski", family_name="Dąbrowski",
            academic_title="mgr", birth_date=date(1985, 8, 11), birth_place="Kraków",
            pesel="85081112345", phone="510123456",
            university="Uniwersytet Jagielloński", edu_year=2010, edu_city="Kraków",
        ))
        pending_fee(e, 100, 25, 1009)