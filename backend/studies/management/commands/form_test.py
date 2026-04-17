from datetime import date, timedelta

from django.core.management import BaseCommand

from enrollments.models import FormData, Address, Enrollment
from enrollments.services import generate_form_docx
from studies.models import Studies, StudiesEdition


class Command(BaseCommand):
    help = 'Creates sample form docx'

    def handle(self, *args, **kwargs):
        studies = Studies(name="Bazy danych", terms_count=3, organizational_unit="Wydział Informatyki",
                description="Lorem ipsum dolor")

        edition = StudiesEdition(studies=studies, price=2137, max_participants=5,
                       start_date=date.today() + timedelta(days=30),
                       end_date=date.today() + timedelta(days=90),
                       status='HIDDEN', syllabus_url="niema", academic_year="2025/2026",
                       recruitment_start_date=date.today() + timedelta(days=3),
                       recruitment_end_date=date.today() + timedelta(days=10))

        address = Address(
            user=None,
            street="Krakowska",
            house_number="5",
            city="Kraków",
            country="Polska",
            postal_code="30-001",
        )

        enrollment = Enrollment(
            user=None,
            studies_edition=edition,
            status=Enrollment.Status.STUDENT,
            enrollment_date=date.today() - timedelta(days=5),
        )

        form = FormData(
            enrollment=enrollment,
            first_name="Student",
            last_name="Drugi",
            family_name="Drugi",
            academic_title="inż",
            birth_date=date(1993, 3, 20),
            birth_place="Kraków",
            pesel="93032012345",
            citizenship="polskie",
            residential_address=address,
            registered_address=address,
            email="student2@gmail.com",
            phone="987654321",
            education="wyższe",
            education_country="Polska",
        )

        name = generate_form_docx(form)
        print(name)