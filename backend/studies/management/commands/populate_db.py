from datetime import date, timedelta

from django.core.management.base import BaseCommand
from rest_framework.fields import empty

from studies.models import Studies, StudiesEdition, StudiesEditionStaff
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
            Studies(name="Bazy danych", terms_count=3, description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque commodo facilisis orci ut faucibus. Sed posuere ligula nec massa feugiat, in bibendum nisi tincidunt. Nulla facilisi. Nulla facilisi. Praesent iaculis nisi diam, sed tempus erat scelerisque ac. Etiam ac felis enim. Praesent porta tortor mauris, sed tincidunt urna tempor in. Etiam non odio sollicitudin, maximus orci vel, feugiat lacus. Nunc placerat accumsan erat, nec dictum mauris porta a. Maecenas vitae fermentum risus. Nam malesuada dui et nisi commodo iaculis. Aliquam viverra dui sed libero sollicitudin euismod."),
            Studies(name="Systemy ERP", terms_count=2, description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque commodo facilisis orci ut faucibus. Sed posuere ligula nec massa feugiat, in bibendum nisi tincidunt. Nulla facilisi. Nulla facilisi. Praesent iaculis nisi diam, sed tempus erat scelerisque ac. Etiam ac felis enim. Praesent porta tortor mauris, sed tincidunt urna tempor in. Etiam non odio sollicitudin, maximus orci vel, feugiat lacus. Nunc placerat accumsan erat, nec dictum mauris porta a. Maecenas vitae fermentum risus. Nam malesuada dui et nisi commodo iaculis. Aliquam viverra dui sed libero sollicitudin euismod."),
        ]
        Studies.objects.bulk_create(studies)
        studies = list(Studies.objects.all())

        editions = [
            StudiesEdition(studies=studies[0], price=2137, max_participants=5,
                           start_date=date.today() + timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='HIDDEN', syllabus_url="niema",
                           recruitment_start_date=date.today() + timedelta(days=3),
                           recruitment_end_date=date.today() + timedelta(days=10)),
            StudiesEdition(studies=studies[1], price=420, max_participants=5,
                           start_date=date.today() + timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='ACTIVE', syllabus_url="niema",
                           recruitment_start_date=date.today() - timedelta(days=2),
                           recruitment_end_date=date.today() + timedelta(days=10)),
            StudiesEdition(studies=studies[0], price=2137, max_participants=5,
                           start_date=date.today() - timedelta(days=30),
                           end_date=date.today() + timedelta(days=90),
                           status='CLOSED', syllabus_url="niema",
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
