from datetime import date, timedelta, datetime, time

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from enrollments.models import Enrollment, Address, FormData, SubmittedDocument, DocumentHistory
from files.models import File
from payments.models import Fee, Payment, PaymentHistory
from studies.models import Studies, StudiesEdition, StudiesEditionStaff, StudiesDocument
from studies.services import on_create_edition
from users.models import User, Employee, WorkPhoneNumber


class Command(BaseCommand):
    help = 'Creates a rich demo database with all statuses, many students and employees'

    def handle(self, *args, **kwargs):
        today = date.today()
        now = timezone.now()

        def dt(days):
            """Timezone-aware datetime offset from now."""
            return now + timedelta(days=days)

        def aware(d):
            """Convert date → timezone-aware datetime at midnight."""
            if isinstance(d, date) and not isinstance(d, datetime):
                return timezone.make_aware(datetime.combine(d, time.min))
            return d

        # ── Czyszczenie ──────────────────────────────────────────────────────
        self.stdout.write('Czyszczenie bazy...')
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

        # ── Użytkownicy — pracownicy ─────────────────────────────────────────
        self.stdout.write('Tworzenie pracowników...')
        employees_raw = [
            dict(email="admin@agh.edu.pl",      first_name="Adam",       last_name="Nowak",       is_staff=True, is_superuser=True, is_employee=True, is_active=True),
            dict(email="f.malinowska@agh.edu.pl", first_name="Felicja",  last_name="Malinowska",  is_employee=True, is_active=True),
            dict(email="f.grabowski@agh.edu.pl",  first_name="Filip",    last_name="Grabowski",   is_employee=True, is_active=True),
            dict(email="f.wisniewski@agh.edu.pl", first_name="Franciszek", last_name="Wiśniewski", is_employee=True, is_active=True),
            dict(email="a.kowalski@agh.edu.pl",   first_name="Andrzej",  last_name="Kowalski",    is_employee=True, is_active=True),
            dict(email="a.nowak@agh.edu.pl",      first_name="Aleksandra", last_name="Nowak",     is_employee=True, is_active=True),
            dict(email="b.kaminska@agh.edu.pl",   first_name="Beata",    last_name="Kamińska",    is_employee=True, is_active=True),
            dict(email="k.jablonska@agh.edu.pl",  first_name="Katarzyna", last_name="Jabłońska",  is_employee=True, is_active=True),
            dict(email="k.piotrowski@agh.edu.pl", first_name="Krzysztof", last_name="Piotrowski", is_employee=True, is_active=True),
            dict(email="m.zawadzka@agh.edu.pl",   first_name="Marta",    last_name="Zawadzka",    is_employee=True, is_active=True),
        ]

        # ── Użytkownicy — studenci ───────────────────────────────────────────
        students_raw = [
            dict(email="anna.kowalska@gmail.com",      first_name="Anna",       last_name="Kowalska"),
            dict(email="piotr.wisniewski@gmail.com",   first_name="Piotr",      last_name="Wiśniewski"),
            dict(email="katarzyna.wojcik@gmail.com",   first_name="Katarzyna",  last_name="Wójcik"),
            dict(email="michal.kowalczyk@gmail.com",   first_name="Michał",     last_name="Kowalczyk"),
            dict(email="agnieszka.kaminska@gmail.com", first_name="Agnieszka",  last_name="Kamińska"),
            dict(email="tomasz.lewandowski@gmail.com", first_name="Tomasz",     last_name="Lewandowski"),
            dict(email="magdalena.zielinska@gmail.com",first_name="Magdalena",  last_name="Zielińska"),
            dict(email="krzysztof.szymanski@gmail.com",first_name="Krzysztof",  last_name="Szymański"),
            dict(email="joanna.wozniak@gmail.com",     first_name="Joanna",     last_name="Woźniak"),
            dict(email="marcin.dabrowski@gmail.com",   first_name="Marcin",     last_name="Dąbrowski"),
            dict(email="barbara.nowak@gmail.com",      first_name="Barbara",    last_name="Nowak"),
            dict(email="lukasz.jankowski@gmail.com",   first_name="Łukasz",     last_name="Jankowski"),
            dict(email="marta.wisniewska@gmail.com",   first_name="Marta",      last_name="Wiśniewska"),
            dict(email="pawel.kaczmarek@gmail.com",    first_name="Paweł",      last_name="Kaczmarek"),
            dict(email="ewa.lis@gmail.com",            first_name="Ewa",        last_name="Lis"),
            dict(email="daniel.mazur@gmail.com",       first_name="Daniel",     last_name="Mazur"),
            dict(email="monika.pawlak@gmail.com",      first_name="Monika",     last_name="Pawlak"),
            dict(email="rafal.adamczyk@gmail.com",     first_name="Rafał",      last_name="Adamczyk"),
            dict(email="sylwia.kubiak@gmail.com",      first_name="Sylwia",     last_name="Kubiak"),
            dict(email="artur.wieczorek@gmail.com",    first_name="Artur",      last_name="Wieczorek"),
            dict(email="natalia.krupa@gmail.com",      first_name="Natalia",    last_name="Krupa"),
            dict(email="grzegorz.bak@gmail.com",       first_name="Grzegorz",   last_name="Bąk"),
            dict(email="karolina.michalska@gmail.com", first_name="Karolina",   last_name="Michalska"),
            dict(email="sebastian.ostrowski@gmail.com",first_name="Sebastian",  last_name="Ostrowski"),
            dict(email="aleksandra.sikora@gmail.com",  first_name="Aleksandra", last_name="Sikora"),
        ]

        all_raw = employees_raw + [dict(**d, is_active=True) for d in students_raw]
        user_objects = []
        for d in all_raw:
            u = User(**d)
            u.set_password('admin')
            user_objects.append(u)
        User.objects.bulk_create(user_objects)

        um = {u.email: u for u in User.objects.filter(email__in=[d['email'] for d in all_raw])}

        emp_emails = [d['email'] for d in employees_raw]
        Employee.objects.bulk_create([Employee(user=um[e]) for e in emp_emails])
        em = {e.user.email: e for e in Employee.objects.select_related('user').filter(user__email__in=emp_emails)}

        WorkPhoneNumber.objects.bulk_create([
            WorkPhoneNumber(employee=em["admin@agh.edu.pl"],          phone="126174000"),
            WorkPhoneNumber(employee=em["f.malinowska@agh.edu.pl"],   phone="126174001"),
            WorkPhoneNumber(employee=em["f.grabowski@agh.edu.pl"],    phone="126174002"),
            WorkPhoneNumber(employee=em["f.wisniewski@agh.edu.pl"],   phone="126174003"),
            WorkPhoneNumber(employee=em["a.kowalski@agh.edu.pl"],     phone="126174004"),
            WorkPhoneNumber(employee=em["a.nowak@agh.edu.pl"],        phone="126174005"),
            WorkPhoneNumber(employee=em["b.kaminska@agh.edu.pl"],     phone="126174006"),
            WorkPhoneNumber(employee=em["k.jablonska@agh.edu.pl"],    phone="126174007"),
            WorkPhoneNumber(employee=em["k.piotrowski@agh.edu.pl"],   phone="126174008"),
            WorkPhoneNumber(employee=em["m.zawadzka@agh.edu.pl"],     phone="126174009"),
        ])

        S = [um[d['email']] for d in students_raw]  # S[0]..S[24]

        # role shortcuts
        dir1  = um["k.jablonska@agh.edu.pl"]
        dir2  = um["k.piotrowski@agh.edu.pl"]
        dir3  = um["m.zawadzka@agh.edu.pl"]
        adm1  = um["a.kowalski@agh.edu.pl"]
        adm2  = um["a.nowak@agh.edu.pl"]
        adm3  = um["b.kaminska@agh.edu.pl"]
        fin1  = um["f.malinowska@agh.edu.pl"]
        fin2  = um["f.grabowski@agh.edu.pl"]
        fin3  = um["f.wisniewski@agh.edu.pl"]

        # ── Kierunki studiów ─────────────────────────────────────────────────
        self.stdout.write('Tworzenie kierunków...')
        Studies.objects.bulk_create([
            Studies(
                name="Bazy danych i Big Data",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Kompleksowy program poświęcony projektowaniu, administracji i optymalizacji systemów "
                    "bazodanowych. Obejmuje relacyjne bazy danych (PostgreSQL, Oracle), NoSQL (MongoDB, Cassandra), "
                    "hurtownie danych, przetwarzanie strumieniowe (Apache Kafka, Spark) oraz narzędzia BI. "
                    "Absolwenci są przygotowani do roli administratora baz danych lub architekta danych."
                ),
            ),
            Studies(
                name="Systemy ERP i Integracje",
                terms_count=2,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Szkolenie z wdrażania i obsługi wiodących systemów ERP: SAP S/4HANA, Microsoft Dynamics 365 "
                    "oraz Oracle ERP Cloud. Uczestnicy poznają procesy biznesowe, integrację systemów przez API "
                    "i ESB, migrację danych oraz zarządzanie zmianą organizacyjną."
                ),
            ),
            Studies(
                name="Cyberbezpieczeństwo",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Intensywny program łączący teorię i praktykę bezpieczeństwa IT. Tematyka obejmuje "
                    "testy penetracyjne (OWASP, Metasploit), analizę złośliwego oprogramowania, "
                    "bezpieczeństwo sieci i aplikacji webowych, kryptografię, reagowanie na incydenty "
                    "oraz zgodność z regulacjami (RODO, NIS2, ISO 27001)."
                ),
            ),
            Studies(
                name="Data Science i Machine Learning",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Interdyscyplinarne studia łączące statystykę, programowanie w Pythonie (scikit-learn, "
                    "TensorFlow, PyTorch) oraz inżynierię cech. Program przygotowuje specjalistów zdolnych "
                    "do analizy dużych zbiorów danych, budowania modeli predykcyjnych, ich ewaluacji "
                    "i wdrażania w środowiskach produkcyjnych (MLflow, Kubeflow)."
                ),
            ),
            Studies(
                name="Zarządzanie Projektami IT",
                terms_count=2,
                organizational_unit="Wydział Zarządzania",
                description=(
                    "Program dedykowany kierownikom projektów i liderom zespołów technicznych. "
                    "Obejmuje metodyki Agile (Scrum, Kanban), tradycyjne (Prince2, PMI/PMP), "
                    "narzędzia (Jira, MS Project) oraz finanse i ryzyka projektowe. "
                    "Słuchacze przygotowują się do egzaminów PMP i PSM."
                ),
            ),
            Studies(
                name="Sztuczna Inteligencja i Deep Learning",
                terms_count=3,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Zaawansowany program poświęcony głębokiemu uczeniu maszynowemu, sieciom neuronowym "
                    "(CNN, RNN, Transformer), przetwarzaniu języka naturalnego (NLP) i widzeniu maszynowemu. "
                    "Praktyczne projekty z wykorzystaniem TensorFlow, PyTorch i Hugging Face. "
                    "Absolwenci zdobywają kompetencje inżyniera AI."
                ),
            ),
            Studies(
                name="DevOps i Cloud Computing",
                terms_count=2,
                organizational_unit="Wydział Informatyki",
                description=(
                    "Program łączący kulturę DevOps z praktyczną obsługą chmur publicznych (AWS, Azure, GCP). "
                    "Tematyka: konteneryzacja (Docker, Kubernetes), CI/CD (GitHub Actions, Jenkins), "
                    "Infrastructure as Code (Terraform, Ansible), monitoring (Prometheus, Grafana) "
                    "i architektury mikroserwisowe."
                ),
            ),
        ])

        sm = {s.name: s for s in Studies.objects.all()}

        # ── Edycje ───────────────────────────────────────────────────────────
        self.stdout.write('Tworzenie edycji...')

        def make_edition(**kwargs):
            kwargs.setdefault('syllabus_url', '')
            edition = StudiesEdition.objects.create(**kwargs)
            if edition.status != StudiesEdition.Status.CLOSED:
                on_create_edition(edition)
            return edition

        # Bazy danych — edycja 2023/2024 CLOSED
        ed_bd_old = make_edition(
            studies=sm["Bazy danych i Big Data"], price=3500, max_participants=20,
            start_date=today - timedelta(days=400), end_date=today - timedelta(days=100),
            status=StudiesEdition.Status.CLOSED,
            academic_year="2025/2026",
            recruitment_start_date=dt(-480),
            recruitment_end_date=dt(-410),
        )
        # Bazy danych — edycja 2024/2025 ACTIVE
        ed_bd = make_edition(
            studies=sm["Bazy danych i Big Data"], price=3900, max_participants=25,
            start_date=today + timedelta(days=30), end_date=today + timedelta(days=300),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/bazy-danych",
            academic_year="2025/2026",
            recruitment_start_date=dt(-20),
            recruitment_end_date=dt(25),
        )
        # Systemy ERP — edycja 2024/2025 ACTIVE
        ed_erp = make_edition(
            studies=sm["Systemy ERP i Integracje"], price=4500, max_participants=18,
            start_date=today + timedelta(days=45), end_date=today + timedelta(days=265),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/erp",
            academic_year="2025/2026",
            recruitment_start_date=dt(-15),
            recruitment_end_date=dt(20),
        )
        # Cyberbezpieczeństwo — edycja 2023/2024 CLOSED
        ed_cyber_old = make_edition(
            studies=sm["Cyberbezpieczeństwo"], price=5200, max_participants=20,
            start_date=today - timedelta(days=350), end_date=today - timedelta(days=50),
            status=StudiesEdition.Status.CLOSED,
            academic_year="2025/2026",
            recruitment_start_date=dt(-420),
            recruitment_end_date=dt(-360),
        )
        # Cyberbezpieczeństwo — edycja 2024/2025 ACTIVE
        ed_cyber = make_edition(
            studies=sm["Cyberbezpieczeństwo"], price=5500, max_participants=20,
            start_date=today + timedelta(days=60), end_date=today + timedelta(days=360),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/cyberbezpieczenstwo",
            academic_year="2025/2026",
            recruitment_start_date=dt(-10),
            recruitment_end_date=dt(35),
        )
        # Data Science — edycja 2024/2025 ACTIVE
        ed_ds = make_edition(
            studies=sm["Data Science i Machine Learning"], price=4800, max_participants=22,
            start_date=today + timedelta(days=50), end_date=today + timedelta(days=320),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/data-science",
            academic_year="2025/2026",
            recruitment_start_date=dt(-18),
            recruitment_end_date=dt(18),
        )
        # Zarządzanie Projektami IT — edycja 2024/2025 ACTIVE
        ed_pm = make_edition(
            studies=sm["Zarządzanie Projektami IT"], price=3400, max_participants=30,
            start_date=today + timedelta(days=70), end_date=today + timedelta(days=290),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/zarzadzanie-projektami",
            academic_year="2025/2026",
            recruitment_start_date=dt(-8),
            recruitment_end_date=dt(40),
        )
        # AI i Deep Learning — edycja 2024/2025 ACTIVE
        ed_ai = make_edition(
            studies=sm["Sztuczna Inteligencja i Deep Learning"], price=5800, max_participants=20,
            start_date=today + timedelta(days=55), end_date=today + timedelta(days=340),
            status=StudiesEdition.Status.ACTIVE,
            syllabus_url="https://www.informatyka.agh.edu.pl/podyplomowe/ai",
            academic_year="2025/2026",
            recruitment_start_date=dt(-5),
            recruitment_end_date=dt(30),
        )
        # DevOps i Cloud — edycja 2024/2025 HIDDEN (planowana)
        ed_devops = make_edition(
            studies=sm["DevOps i Cloud Computing"], price=4200, max_participants=25,
            start_date=today + timedelta(days=120), end_date=today + timedelta(days=340),
            status=StudiesEdition.Status.HIDDEN,
            academic_year="2025/2026",
            recruitment_start_date=dt(30),
            recruitment_end_date=dt(90),
        )

        # ── Przypisania pracowników ──────────────────────────────────────────
        self.stdout.write('Przypisywanie pracowników do edycji...')
        staff_assignments = [
            (ed_bd_old,   dir1, adm1, fin1),
            (ed_bd,       dir1, adm1, fin1),
            (ed_erp,      dir2, adm2, fin2),
            (ed_cyber_old, dir3, adm3, fin3),
            (ed_cyber,    dir3, adm3, fin3),
            (ed_ds,       dir1, adm2, fin2),
            (ed_pm,       dir2, adm1, fin1),
            (ed_ai,       dir3, adm2, fin3),
            (ed_devops,   dir2, adm3, fin2),
        ]
        StudiesEditionStaff.objects.bulk_create([
            entry
            for edition, director, admin, finance in staff_assignments
            for entry in [
                StudiesEditionStaff(studies_edition=edition, user=director, role='STUDIES_DIRECTOR'),
                StudiesEditionStaff(studies_edition=edition, user=admin,    role='ADMINISTRATIVE_COORDINATOR'),
                StudiesEditionStaff(studies_edition=edition, user=finance,  role='FINANCE_COORDINATOR'),
            ]
        ])

        # ── Dodatkowe dokumenty edycji ACTIVE ───────────────────────────────
        self.stdout.write('Dodawanie dokumentów edycji...')
        active_editions = [ed_bd, ed_erp, ed_cyber, ed_ds, ed_pm, ed_ai, ed_devops]
        doc_entries = []
        for edition in active_editions:
            doc_entries += [
                StudiesDocument(
                    studies_edition=edition,
                    name="Kopia dyplomu ukończenia studiów wyższych",
                    required=True,
                    due_date=dt(45),
                ),
                StudiesDocument(
                    studies_edition=edition,
                    name="Zdjęcie legitymacyjne (35×45 mm)",
                    required=True,
                    due_date=dt(45),
                ),
                StudiesDocument(
                    studies_edition=edition,
                    name="Curriculum Vitae",
                    required=False,
                    due_date=dt(45),
                ),
                StudiesDocument(
                    studies_edition=edition,
                    name="Zgoda pracodawcy na uczestnictwo w studiach",
                    required=False,
                    due_date=dt(60),
                ),
            ]
        StudiesDocument.objects.bulk_create(doc_entries)

        # ── Helpers ──────────────────────────────────────────────────────────

        def make_addr(user, street, house, city, postal, flat=""):
            return Address.objects.create(
                user=user, street=street, house_number=house, flat_number=flat,
                city=city, country="Polska", postal_code=postal,
            )

        def make_enrollment(user, edition, status, days_ago, fd, note=""):
            addr = make_addr(user, fd['street'], fd['house'], fd['city'], fd['postal'], fd.get('flat', ''))
            enr = Enrollment.objects.create(
                user=user,
                studies_edition=edition,
                status=status,
                status_note=note,
                enrollment_date=today - timedelta(days=days_ago),
            )
            FormData.objects.create(
                enrollment=enr,
                first_name=fd['first_name'],
                second_name=fd.get('second_name', ''),
                last_name=fd['last_name'],
                family_name=fd['family_name'],
                academic_title=fd['title'],
                birth_date=fd['birth_date'],
                birth_place=fd['birth_place'],
                pesel=fd['pesel'],
                citizenship="polskie",
                residential_address=addr,
                registered_address=addr,
                email=user.email,
                phone=fd['phone'],
                education_university=fd['university'],
                education_year=str(fd['edu_year']),
                education_location=fd['edu_city'],
                maturity_country="Polska",
                emergency_name=fd.get('emergency_name', ''),
                emergency_last_name=fd.get('emergency_last_name', ''),
                emergency_phone=fd.get('emergency_phone', ''),
            )
            return enr

        def add_fee(enr, amount, due_days, paid=True, paid_days=5, ref=None):
            fee = Fee.objects.create(
                enrollment=enr,
                title=f"Opłata rekrutacyjna — {enr.studies_edition.studies.name}",
                amount=amount,
                due_date=dt(due_days),
                paid_date=dt(-paid_days) if paid else None,
            )
            status = "COMPLETED" if paid else "PENDING"
            pmt = Payment.objects.create(
                fee=fee, payment_method="PRZELEW",
                reference_number=ref or enr.id,
                status=status,
            )
            PaymentHistory.objects.create(payment=pmt, previous_status=None, new_status=status)

        def add_docs(enr, status=SubmittedDocument.Status.ACCEPTED):
            """Create SubmittedDocuments for all required docs in the enrollment's edition."""
            required_docs = StudiesDocument.objects.filter(
                studies_edition=enr.studies_edition,
                required=True,
            )
            for doc in required_docs:
                dummy = SimpleUploadedFile(
                    f'demo_doc_{enr.id}_{doc.id}.pdf',
                    b'%PDF-1.4 demo document',
                    content_type='application/pdf',
                )
                f = File.objects.create(file=dummy, source=File.Source.SUBMITTED)
                SubmittedDocument.objects.create(
                    enrollment=enr,
                    studies_document=doc,
                    file=f,
                    status=status,
                )

        # ── Rejestracje ──────────────────────────────────────────────────────
        self.stdout.write('Tworzenie rekrutacji...')

        # ── STUDENTs — zaakceptowani ─────────────────────────────────────────

        # S[0] Anna Kowalska — STUDENT, Bazy danych 2024/2025
        e = make_enrollment(S[0], ed_bd, Enrollment.Status.STUDENT, 18, dict(
            street="Marszałkowska", house="12", flat="5", city="Warszawa", postal="00-001",
            first_name="Anna", last_name="Kowalska", family_name="Wiśniewska",
            title="mgr", birth_date=date(1992, 3, 14), birth_place="Warszawa",
            pesel="92031412345", phone="501234567",
            university="Politechnika Warszawska", edu_year=2018, edu_city="Warszawa",
            emergency_name="Jan", emergency_last_name="Kowalski", emergency_phone="600111222",
        ))
        add_fee(e, 100, 14, paid=True, paid_days=12, ref=2001)

        # S[1] Piotr Wiśniewski — STUDENT, Systemy ERP
        e = make_enrollment(S[1], ed_erp, Enrollment.Status.STUDENT, 14, dict(
            street="Floriańska", house="5", city="Kraków", postal="31-019",
            first_name="Piotr", last_name="Wiśniewski", family_name="Wiśniewski",
            title="mgr inż", birth_date=date(1988, 7, 22), birth_place="Kraków",
            pesel="88072212346", phone="502345678",
            university="AGH Akademia Górniczo-Hutnicza", edu_year=2014, edu_city="Kraków",
        ))
        add_fee(e, 100, 10, paid=True, paid_days=10, ref=2002)

        # S[3] Michał Kowalczyk — STUDENT, Data Science
        e = make_enrollment(S[3], ed_ds, Enrollment.Status.STUDENT, 16, dict(
            street="Półwiejska", house="8", city="Poznań", postal="61-888",
            first_name="Michał", last_name="Kowalczyk", family_name="Kowalczyk",
            title="mgr", birth_date=date(1990, 5, 3), birth_place="Poznań",
            pesel="90050312347", phone="504567890",
            university="Uniwersytet im. Adama Mickiewicza", edu_year=2016, edu_city="Poznań",
        ))
        add_fee(e, 100, 20, paid=True, paid_days=14, ref=2003)

        # S[5] Tomasz Lewandowski — STUDENT, Zarządzanie Projektami IT
        e = make_enrollment(S[5], ed_pm, Enrollment.Status.STUDENT, 12, dict(
            street="Długa", house="33", city="Gdańsk", postal="80-827",
            first_name="Tomasz", last_name="Lewandowski", family_name="Lewandowski",
            title="mgr", birth_date=date(1985, 9, 17), birth_place="Gdańsk",
            pesel="85091712348", phone="505678901",
            university="Politechnika Gdańska", edu_year=2011, edu_city="Gdańsk",
        ))
        add_fee(e, 100, 25, paid=True, paid_days=10, ref=2004)

        # S[6] Magdalena Zielińska — STUDENT, Cyberbezpieczeństwo
        e = make_enrollment(S[6], ed_cyber, Enrollment.Status.STUDENT, 20, dict(
            street="Śląska", house="17", flat="3", city="Katowice", postal="40-001",
            first_name="Magdalena", last_name="Zielińska", family_name="Kowalczyk",
            title="mgr", birth_date=date(1991, 6, 25), birth_place="Katowice",
            pesel="91062512349", phone="507890123",
            university="Politechnika Śląska", edu_year=2015, edu_city="Gliwice",
            emergency_name="Marek", emergency_last_name="Zieliński", emergency_phone="700222333",
        ))
        add_fee(e, 100, 15, paid=True, paid_days=18, ref=2005)

        # S[8] Joanna Woźniak — STUDENT, AI i Deep Learning
        e = make_enrollment(S[8], ed_ai, Enrollment.Status.STUDENT, 8, dict(
            street="Nowy Świat", house="3", city="Warszawa", postal="00-497",
            first_name="Joanna", last_name="Woźniak", family_name="Nowak",
            title="mgr inż", birth_date=date(1989, 4, 17), birth_place="Warszawa",
            pesel="89041712350", phone="509012345",
            university="Politechnika Warszawska", edu_year=2013, edu_city="Warszawa",
        ))
        add_fee(e, 100, 18, paid=True, paid_days=6, ref=2006)

        # S[10] Barbara Nowak — STUDENT, Bazy danych 2024/2025
        e = make_enrollment(S[10], ed_bd, Enrollment.Status.STUDENT, 15, dict(
            street="Krakowska", house="22", flat="8", city="Wrocław", postal="50-001",
            first_name="Barbara", last_name="Nowak", family_name="Malinowska",
            title="mgr", birth_date=date(1987, 11, 30), birth_place="Wrocław",
            pesel="87113012351", phone="510123456",
            university="Politechnika Wrocławska", edu_year=2012, edu_city="Wrocław",
        ))
        add_fee(e, 100, 14, paid=True, paid_days=13, ref=2007)

        # S[11] Łukasz Jankowski — STUDENT, Systemy ERP
        e = make_enrollment(S[11], ed_erp, Enrollment.Status.STUDENT, 11, dict(
            street="Lipowa", house="9", city="Lublin", postal="20-001",
            first_name="Łukasz", last_name="Jankowski", family_name="Jankowski",
            title="inż", birth_date=date(1993, 2, 8), birth_place="Lublin",
            pesel="93020812352", phone="511234567",
            university="Politechnika Lubelska", edu_year=2017, edu_city="Lublin",
        ))
        add_fee(e, 100, 10, paid=True, paid_days=9, ref=2008)

        # S[12] Marta Wiśniewska — STUDENT, Data Science
        e = make_enrollment(S[12], ed_ds, Enrollment.Status.STUDENT, 13, dict(
            street="Piotrkowska", house="100", flat="12", city="Łódź", postal="90-004",
            first_name="Marta", last_name="Wiśniewska", family_name="Kowalska",
            title="mgr", birth_date=date(1994, 8, 21), birth_place="Łódź",
            pesel="94082112353", phone="512345678",
            university="Politechnika Łódzka", edu_year=2019, edu_city="Łódź",
        ))
        add_fee(e, 100, 20, paid=True, paid_days=11, ref=2009)

        # S[18] Sylwia Kubiak — STUDENT, Zarządzanie Projektami IT
        e = make_enrollment(S[18], ed_pm, Enrollment.Status.STUDENT, 10, dict(
            street="Wysoka", house="4", city="Szczecin", postal="70-001",
            first_name="Sylwia", last_name="Kubiak", family_name="Adamska",
            title="mgr", birth_date=date(1986, 3, 15), birth_place="Szczecin",
            pesel="86031512354", phone="518901234",
            university="Uniwersytet Szczeciński", edu_year=2011, edu_city="Szczecin",
        ))
        add_fee(e, 100, 25, paid=True, paid_days=8, ref=2010)

        # ── CANDIDATEs — złożyli wniosek, czekają ───────────────────────────

        # S[2] Katarzyna Wójcik — CANDIDATE, Data Science
        e = make_enrollment(S[2], ed_ds, Enrollment.Status.CANDIDATE, 5, dict(
            street="Świdnicka", house="20", city="Wrocław", postal="50-066",
            first_name="Katarzyna", last_name="Wójcik", family_name="Wójcik",
            title="mgr", birth_date=date(1995, 11, 8), birth_place="Wrocław",
            pesel="95110812355", phone="503456789",
            university="Politechnika Wrocławska", edu_year=2021, edu_city="Wrocław",
        ))
        add_fee(e, 100, 20, paid=True, paid_days=3, ref=2011)

        # S[4] Agnieszka Kamińska — CANDIDATE, Bazy danych
        e = make_enrollment(S[4], ed_bd, Enrollment.Status.CANDIDATE, 7, dict(
            street="Lipowa", house="45", city="Białystok", postal="15-427",
            first_name="Agnieszka", last_name="Kamińska", family_name="Wiśniewska",
            title="inż", birth_date=date(1997, 2, 19), birth_place="Białystok",
            pesel="97021912356", phone="504678901",
            university="Politechnika Białostocka", edu_year=2021, edu_city="Białystok",
        ))
        add_fee(e, 100, 15, paid=False, ref=2012)  # nie opłaciła jeszcze

        # S[13] Paweł Kaczmarek — CANDIDATE, Cyberbezpieczeństwo
        e = make_enrollment(S[13], ed_cyber, Enrollment.Status.CANDIDATE, 4, dict(
            street="Grunwaldzka", house="14", city="Poznań", postal="60-001",
            first_name="Paweł", last_name="Kaczmarek", family_name="Kaczmarek",
            title="mgr inż", birth_date=date(1991, 7, 12), birth_place="Poznań",
            pesel="91071212357", phone="513456789",
            university="Politechnika Poznańska", edu_year=2016, edu_city="Poznań",
        ))
        add_fee(e, 100, 18, paid=True, paid_days=2, ref=2013)

        # S[16] Monika Pawlak — CANDIDATE, AI i Deep Learning
        e = make_enrollment(S[16], ed_ai, Enrollment.Status.CANDIDATE, 3, dict(
            street="Norwida", house="7", flat="2", city="Kraków", postal="31-103",
            first_name="Monika", last_name="Pawlak", family_name="Kowalczyk",
            title="mgr", birth_date=date(1993, 9, 28), birth_place="Kraków",
            pesel="93092812358", phone="516789012",
            university="Akademia Górniczo-Hutnicza", edu_year=2018, edu_city="Kraków",
        ))
        add_fee(e, 100, 12, paid=True, paid_days=1, ref=2014)

        # S[24] Aleksandra Sikora — CANDIDATE, Zarządzanie Projektami IT
        e = make_enrollment(S[24], ed_pm, Enrollment.Status.CANDIDATE, 2, dict(
            street="Polna", house="18", city="Warszawa", postal="00-625",
            first_name="Aleksandra", last_name="Sikora", family_name="Dąbrowska",
            title="mgr", birth_date=date(1990, 1, 4), birth_place="Gdynia",
            pesel="90010412359", phone="524901234",
            university="Szkoła Główna Handlowa", edu_year=2015, edu_city="Warszawa",
        ))
        add_fee(e, 100, 30, paid=False, ref=2015)

        # ── RESERVEs — lista rezerwowa ────────────────────────────────────────

        # S[9] Marcin Dąbrowski — RESERVE, Bazy danych
        e = make_enrollment(S[9], ed_bd, Enrollment.Status.RESERVE, 9, dict(
            street="Krakowska", house="22", city="Kraków", postal="31-062",
            first_name="Marcin", last_name="Dąbrowski", family_name="Dąbrowski",
            title="mgr", birth_date=date(1985, 8, 11), birth_place="Kraków",
            pesel="85081112360", phone="509123456",
            university="Uniwersytet Jagielloński", edu_year=2010, edu_city="Kraków",
        ), note="Lista rezerwowa — przekroczono limit miejsc")
        add_fee(e, 100, 25, paid=True, paid_days=7, ref=2016)

        # S[19] Artur Wieczorek — RESERVE, Data Science
        e = make_enrollment(S[19], ed_ds, Enrollment.Status.RESERVE, 6, dict(
            street="Robotnicza", house="50", city="Wrocław", postal="53-608",
            first_name="Artur", last_name="Wieczorek", family_name="Wieczorek",
            title="inż", birth_date=date(1988, 12, 3), birth_place="Wrocław",
            pesel="88120312361", phone="519012345",
            university="Politechnika Wrocławska", edu_year=2013, edu_city="Wrocław",
        ), note="Lista rezerwowa")
        add_fee(e, 100, 20, paid=False, ref=2017)

        # S[21] Grzegorz Bąk — RESERVE, Cyberbezpieczeństwo
        e = make_enrollment(S[21], ed_cyber, Enrollment.Status.RESERVE, 8, dict(
            street="Legnicka", house="3", city="Wrocław", postal="53-671",
            first_name="Grzegorz", last_name="Bąk", family_name="Bąk",
            title="mgr inż", birth_date=date(1982, 6, 19), birth_place="Wrocław",
            pesel="82061912362", phone="521345678",
            university="Politechnika Wrocławska", edu_year=2007, edu_city="Wrocław",
        ), note="Lista rezerwowa — oczekuje na decyzję")
        add_fee(e, 100, 18, paid=True, paid_days=5, ref=2018)

        # ── REJECTEDs — odrzuceni ────────────────────────────────────────────

        # S[14] Ewa Lis — REJECTED, Bazy danych
        e = make_enrollment(S[14], ed_bd, Enrollment.Status.REJECTED, 25, dict(
            street="Mostowa", house="11", city="Toruń", postal="87-100",
            first_name="Ewa", last_name="Lis", family_name="Lis",
            title="lic", birth_date=date(1998, 4, 6), birth_place="Toruń",
            pesel="98040612363", phone="514567890",
            university="Uniwersytet Mikołaja Kopernika", edu_year=2021, edu_city="Toruń",
        ), note="Brak wymaganych dokumentów w terminie")
        add_fee(e, 100, -10, paid=False, ref=2019)

        # S[15] Daniel Mazur — REJECTED, Systemy ERP
        e = make_enrollment(S[15], ed_erp, Enrollment.Status.REJECTED, 20, dict(
            street="Słowackiego", house="8", flat="6", city="Rzeszów", postal="35-060",
            first_name="Daniel", last_name="Mazur", family_name="Mazur",
            title="mgr", birth_date=date(1986, 10, 22), birth_place="Rzeszów",
            pesel="86102212364", phone="515678901",
            university="Politechnika Rzeszowska", edu_year=2011, edu_city="Rzeszów",
        ), note="Niespełnienie wymagań wstępnych kierunku")

        # S[20] Natalia Krupa — REJECTED, AI i Deep Learning
        e = make_enrollment(S[20], ed_ai, Enrollment.Status.REJECTED, 15, dict(
            street="Starowiślna", house="30", city="Kraków", postal="31-038",
            first_name="Natalia", last_name="Krupa", family_name="Wiśniewska",
            title="lic", birth_date=date(1999, 7, 15), birth_place="Kraków",
            pesel="99071512365", phone="520234567",
            university="Akademia Górniczo-Hutnicza", edu_year=2022, edu_city="Kraków",
        ), note="Złożony po terminie rekrutacji")

        # ── EXPELLEDs — skreśleni ────────────────────────────────────────────

        # S[7] Krzysztof Szymański — EXPELLED, Bazy danych CLOSED 2023/2024
        make_enrollment(S[7], ed_bd_old, Enrollment.Status.EXPELLED, 300, dict(
            street="Lipowa", house="7", city="Białystok", postal="15-427",
            first_name="Krzysztof", last_name="Szymański", family_name="Szymański",
            title="lic", birth_date=date(1993, 12, 1), birth_place="Białystok",
            pesel="93120112366", phone="507901234",
            university="Uniwersytet w Białymstoku", edu_year=2017, edu_city="Białystok",
        ), note="Brak zaliczenia semestru I — nieuregulowane zaległości finansowe")

        # S[22] Karolina Michalska — EXPELLED, Cyberbezpieczeństwo CLOSED 2023/2024
        make_enrollment(S[22], ed_cyber_old, Enrollment.Status.EXPELLED, 200, dict(
            street="Rejtana", house="12", flat="1", city="Rzeszów", postal="35-310",
            first_name="Karolina", last_name="Michalska", family_name="Zając",
            title="mgr", birth_date=date(1990, 3, 25), birth_place="Rzeszów",
            pesel="90032512367", phone="522456789",
            university="Politechnika Rzeszowska", edu_year=2014, edu_city="Rzeszów",
        ), note="Nieusprawiedliwiona nieobecność powyżej dopuszczalnego limitu")

        # ── DRAFTs — rozpoczęli, nie wysłali ────────────────────────────────

        # S[17] Rafał Adamczyk — DRAFT, Data Science (formularz niewysłany)
        make_enrollment(S[17], ed_ds, Enrollment.Status.DRAFT, 1, dict(
            street="Wiśniowa", house="6", city="Łódź", postal="93-001",
            first_name="Rafał", last_name="Adamczyk", family_name="Adamczyk",
            title="mgr inż", birth_date=date(1992, 5, 9), birth_place="Łódź",
            pesel="92050912368", phone="517890123",
            university="Politechnika Łódzka", edu_year=2017, edu_city="Łódź",
        ))

        # S[23] Sebastian Ostrowski — DRAFT, AI i Deep Learning
        make_enrollment(S[23], ed_ai, Enrollment.Status.DRAFT, 0, dict(
            street="Chrobrego", house="2", city="Bydgoszcz", postal="85-047",
            first_name="Sebastian", last_name="Ostrowski", family_name="Ostrowski",
            title="mgr", birth_date=date(1989, 8, 30), birth_place="Bydgoszcz",
            pesel="89083012369", phone="523567890",
            university="Uniwersytet Technologiczno-Przyrodniczy", edu_year=2014, edu_city="Bydgoszcz",
        ))

        # ── STUDENT ze starej edycji (CLOSED) ────────────────────────────────

        # S[17] Rafał Adamczyk — był też STUDENT w starej edycji Bazy danych
        e = make_enrollment(S[17], ed_bd_old, Enrollment.Status.STUDENT, 380, dict(
            street="Wiśniowa", house="6", city="Łódź", postal="93-001",
            first_name="Rafał", last_name="Adamczyk", family_name="Adamczyk",
            title="mgr inż", birth_date=date(1992, 5, 9), birth_place="Łódź",
            pesel="92050912368", phone="517890123",
            university="Politechnika Łódzka", edu_year=2017, edu_city="Łódź",
        ))
        add_fee(e, 100, -300, paid=True, paid_days=365, ref=2020)

        # ── Dokumenty dla studentów i kandydatów ────────────────────────────
        self.stdout.write('Dodawanie dokumentów...')
        for enr in Enrollment.objects.filter(status=Enrollment.Status.STUDENT):
            add_docs(enr, status=SubmittedDocument.Status.ACCEPTED)
        for enr in Enrollment.objects.filter(status=Enrollment.Status.CANDIDATE):
            add_docs(enr, status=SubmittedDocument.Status.SUBMITTED)

        self.stdout.write(self.style.SUCCESS(
            '\nBaza danych demo wypełniona pomyślnie!\n'
            f'  Pracownicy: {len(employees_raw)}\n'
            f'  Studenci:   {len(students_raw)}\n'
            f'  Kierunki:   {Studies.objects.count()}\n'
            f'  Edycje:     {StudiesEdition.objects.count()}\n'
            f'  Rekrutacje: {Enrollment.objects.count()}\n'
            f'    STUDENT:  {Enrollment.objects.filter(status=Enrollment.Status.STUDENT).count()}\n'
            f'    CANDIDATE:{Enrollment.objects.filter(status=Enrollment.Status.CANDIDATE).count()}\n'
            f'    RESERVE:  {Enrollment.objects.filter(status=Enrollment.Status.RESERVE).count()}\n'
            f'    REJECTED: {Enrollment.objects.filter(status=Enrollment.Status.REJECTED).count()}\n'
            f'    EXPELLED: {Enrollment.objects.filter(status=Enrollment.Status.EXPELLED).count()}\n'
            f'    DRAFT:    {Enrollment.objects.filter(status=Enrollment.Status.DRAFT).count()}\n'
        ))
