from datetime import date, timedelta

from django.core.management.base import BaseCommand

from enrollments.models import Enrollment, Address, FormData
from payments.models import Fees, Payments, PaymentsHistory
from studies.models import Studies, StudiesEdition, StudiesEditionStaff, StudiesDocument
from studies.services import DELIVERY_DOCUMENT_NAME
from users.models import User, Employee


class Command(BaseCommand):
    help = 'Creates application data'

    def handle(self, *args, **kwargs):
        users = [
            User(email="admin@gmail.com", first_name="admin", last_name="admin", is_staff=True, is_superuser=True, is_employee=True, is_active=True),
            User(email="student1@gmail.com", first_name="student1", last_name="student1"),
            User(email="student2@gmail.com", first_name="student2", last_name="student2"),
            User(email="finansowy@gmail.com", first_name="finansowy", last_name="finansowy", is_employee=True),
            User(email="administracyjny@gmail.com", first_name="administracyjny", last_name="administracyjny", is_employee=True),
            User(email="kierownik@gmail.com", first_name="kierownik", last_name="kierownik", is_employee=True),
        ]
        for user in users:
            user.set_password('admin')
        User.objects.bulk_create(users)

        employees = [
            Employee(user=users[0]),
            Employee(user=users[3]),
            Employee(user=users[4]),
            Employee(user=users[5]),
        ]
        Employee.objects.bulk_create(employees)

        studies = [
            Studies(name="Bazy danych", terms_count=3, organizational_unit="Wydział Informatyki",
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque commodo facilisis orci ut faucibus. Sed posuere ligula nec massa feugiat, in bibendum nisi tincidunt. Nulla facilisi. Nulla facilisi. Praesent iaculis nisi diam, sed tempus erat scelerisque ac. Etiam ac felis enim. Praesent porta tortor mauris, sed tincidunt urna tempor in. Etiam non odio sollicitudin, maximus orci vel, feugiat lacus. Nunc placerat accumsan erat, nec dictum mauris porta a. Maecenas vitae fermentum risus. Nam malesuada dui et nisi commodo iaculis. Aliquam viverra dui sed libero sollicitudin euismod."),
            Studies(name="Systemy ERP", terms_count=2, organizational_unit="Wydział Informatyki",
                    description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque commodo facilisis orci ut faucibus. Sed posuere ligula nec massa feugiat, in bibendum nisi tincidunt. Nulla facilisi. Nulla facilisi. Praesent iaculis nisi diam, sed tempus erat scelerisque ac. Etiam ac felis enim. Praesent porta tortor mauris, sed tincidunt urna tempor in. Etiam non odio sollicitudin, maximus orci vel, feugiat lacus. Nunc placerat accumsan erat, nec dictum mauris porta a. Maecenas vitae fermentum risus. Nam malesuada dui et nisi commodo iaculis. Aliquam viverra dui sed libero sollicitudin euismod."),
        ]
        Studies.objects.bulk_create(studies)
        studies = list(Studies.objects.all())

        editions = [
            StudiesEdition(studies=studies[0], price=2137, max_participants=5,
                           start_date=date.today() + timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='HIDDEN', syllabus_url="niema", academic_year="2025/2026",
                           recruitment_start_date=date.today() + timedelta(days=3),
                           recruitment_end_date=date.today() + timedelta(days=10)),
            StudiesEdition(studies=studies[1], price=420, max_participants=5,
                           start_date=date.today() + timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='ACTIVE', syllabus_url="niema", academic_year="2025/2026",
                           recruitment_start_date=date.today() - timedelta(days=2),
                           recruitment_end_date=date.today() + timedelta(days=10)),
            StudiesEdition(studies=studies[0], price=2137, max_participants=5,
                           start_date=date.today() - timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='CLOSED', syllabus_url="niema", academic_year="2025/2026",
                           recruitment_start_date=date.today() - timedelta(days=60),
                           recruitment_end_date=date.today() - timedelta(days=50))
        ]
        StudiesEdition.objects.bulk_create(editions)
        editions = list(StudiesEdition.objects.all())

        finance = User.objects.filter(email="finansowy@gmail.com").first()
        administrative = User.objects.filter(email="administracyjny@gmail.com").first()
        director = User.objects.filter(email="kierownik@gmail.com").first()
        staff = [
            StudiesEditionStaff(studies_edition=editions[0], user=director, role='STUDIES_DIRECTOR'),
            StudiesEditionStaff(studies_edition=editions[1], user=director, role='STUDIES_DIRECTOR'),
            StudiesEditionStaff(studies_edition=editions[2], user=director, role='STUDIES_DIRECTOR'),
            StudiesEditionStaff(studies_edition=editions[0], user=administrative, role='ADMINISTRATIVE_COORDINATOR'),
            StudiesEditionStaff(studies_edition=editions[1], user=administrative, role='ADMINISTRATIVE_COORDINATOR'),
            StudiesEditionStaff(studies_edition=editions[1], user=finance, role='FINANCE_COORDINATOR'),
            StudiesEditionStaff(studies_edition=editions[2], user=finance, role='FINANCE_COORDINATOR'),
        ]
        StudiesEditionStaff.objects.bulk_create(staff)

        documents = [
            StudiesDocument(studies_edition=editions[1], name="Ważny dokument", required=True, due_date=date.today() + timedelta(days=10))
        ]
        StudiesDocument.objects.bulk_create(documents)

        # Enrollment dla student1 w edycji "Systemy ERP" (ACTIVE)
        student1 = User.objects.get(email="student1@gmail.com")
        active_edition = editions[1]  # Systemy ERP, ACTIVE

        address = Address.objects.create(
            user=student1,
            street="Marszałkowska",
            house_number="10",
            city="Warszawa",
            country="Polska",
            postal_code="00-001",
        )

        enrollment = Enrollment.objects.create(
            user=student1,
            studies_edition=active_edition,
            status=Enrollment.Status.CANDIDATE,
            enrollment_date=date.today(),
        )

        FormData.objects.create(
            enrollment=enrollment,
            first_name="Student",
            last_name="Pierwszy",
            family_name="Pierwszy",
            academic_title="mgr",
            birth_date=date(1995, 5, 15),
            birth_place="Warszawa",
            pesel="95051512345",
            citizenship="polskie",
            residential_address=address,
            registered_address=address,
            email="student1@gmail.com",
            phone="123456789",
            education="wyższe",
            education_country="Polska",
        )

        # Nieopłacona opłata
        unpaid_fee = Fees.objects.create(
            enrollment=enrollment,
            title=f"Opłata za {active_edition.studies.name}",
            amount=active_edition.price,
            due_date=active_edition.start_date,
        )

        # Student2 — STUDENT z opłaconą płatnością
        student2 = User.objects.get(email="student2@gmail.com")

        address2 = Address.objects.create(
            user=student2,
            street="Krakowska",
            house_number="5",
            city="Kraków",
            country="Polska",
            postal_code="30-001",
        )

        enrollment2 = Enrollment.objects.create(
            user=student2,
            studies_edition=active_edition,
            status=Enrollment.Status.STUDENT,
            enrollment_date=date.today() - timedelta(days=5),
        )

        FormData.objects.create(
            enrollment=enrollment2,
            first_name="Student",
            last_name="Drugi",
            family_name="Drugi",
            academic_title="inż",
            birth_date=date(1993, 3, 20),
            birth_place="Kraków",
            pesel="93032012345",
            citizenship="polskie",
            residential_address=address2,
            registered_address=address2,
            email="student2@gmail.com",
            phone="987654321",
            education="wyższe",
            education_country="Polska",
        )

        paid_fee = Fees.objects.create(
            enrollment=enrollment2,
            title=f"Opłata za {active_edition.studies.name}",
            amount=active_edition.price,
            due_date=active_edition.start_date,
            paid_date=date.today() - timedelta(days=3),
        )

        payment = Payments.objects.create(
            fee=paid_fee,
            payment_method="MOCK",
            reference_number=67,
            status="COMPLETED",
        )

        PaymentsHistory.objects.create(
            payment=payment,
            previous_status=None,
            new_status="COMPLETED",
        )
