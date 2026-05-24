from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from enrollments.models import Enrollment
from studies.models import Studies, StudiesEdition, StudiesEditionStaff
from studies.services import close_recruitment, get_user_editions_queryset, open_recruitment
from users.models import Employee
from users.models import User


def create_user(email, is_staff=False, is_employee=False):
	return User.objects.create(
		email=email,
		first_name="Test",
		last_name="User",
		is_staff=is_staff,
		is_employee=is_employee,
	)


def create_edition(studies, status=StudiesEdition.Status.ACTIVE):
	now = timezone.now()
	return StudiesEdition.objects.create(
		studies=studies,
		price=Decimal("2000.00"),
		start_date=(now + timedelta(days=60)).date(),
		end_date=(now + timedelta(days=120)).date(),
		max_participants=10,
		status=status,
		syllabus_url="https://example.com/syllabus",
		recruitment_start_date=now - timedelta(days=1),
		recruitment_end_date=now + timedelta(days=30),
		academic_year="2026/2027",
	)


class StudiesServicesTests(TestCase):
	def setUp(self):
		self.studies = Studies.objects.create(
			name="Data Science",
			organizational_unit="Faculty",
			terms_count=2,
			description="Desc",
		)

	def test_get_user_editions_queryset_returns_all_for_staff(self):
		staff = create_user("staff@example.com", is_staff=True)
		edition_1 = create_edition(self.studies)
		edition_2 = create_edition(self.studies)

		result_ids = set(get_user_editions_queryset(staff).values_list("id", flat=True))

		self.assertEqual(result_ids, {edition_1.id, edition_2.id})

	def test_get_user_editions_queryset_returns_only_assigned_for_employee(self):
		employee = create_user("employee@example.com", is_employee=True)
		other = create_user("other@example.com", is_employee=True)
		assigned_edition = create_edition(self.studies)
		unassigned_edition = create_edition(self.studies)

		StudiesEditionStaff.objects.create(
			studies_edition=assigned_edition,
			user=employee,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)
		StudiesEditionStaff.objects.create(
			studies_edition=unassigned_edition,
			user=other,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)

		result_ids = set(get_user_editions_queryset(employee).values_list("id", flat=True))

		self.assertEqual(result_ids, {assigned_edition.id})

	@patch("enrollments.services.send_notif_to")
	def test_close_recruitment_rejects_remaining_enrollments(self, _mock_send_notif):
		edition = create_edition(self.studies, status=StudiesEdition.Status.ACTIVE)
		candidate = create_user("candidate@example.com")
		draft = create_user("draft@example.com")
		reserve = create_user("reserve@example.com")

		Enrollment.objects.create(
			user=candidate,
			studies_edition=edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)
		Enrollment.objects.create(
			user=draft,
			studies_edition=edition,
			status=Enrollment.Status.DRAFT,
			enrollment_date=timezone.now(),
		)
		Enrollment.objects.create(
			user=reserve,
			studies_edition=edition,
			status=Enrollment.Status.RESERVE,
			enrollment_date=timezone.now(),
		)

		close_recruitment(edition.id)
		edition.refresh_from_db()

		statuses = set(
			Enrollment.objects.filter(studies_edition=edition).values_list("status", flat=True)
		)

		self.assertEqual(edition.status, StudiesEdition.Status.CLOSED)
		self.assertEqual(statuses, {Enrollment.Status.REJECTED})

	def test_open_recruitment_changes_hidden_to_active(self):
		edition = create_edition(self.studies, status=StudiesEdition.Status.HIDDEN)

		open_recruitment(edition.id)
		edition.refresh_from_db()

		self.assertEqual(edition.status, StudiesEdition.Status.ACTIVE)


class StudiesPublicEndpointsTests(APITestCase):
	def setUp(self):
		self.studies = Studies.objects.create(
			name="Public Studies",
			organizational_unit="Faculty",
			terms_count=2,
			description="Desc",
		)

	def test_editions_list_returns_only_public_visible(self):
		active = create_edition(self.studies, status=StudiesEdition.Status.ACTIVE)
		closed = create_edition(self.studies, status=StudiesEdition.Status.CLOSED)
		hidden = create_edition(self.studies, status=StudiesEdition.Status.HIDDEN)

		response = self.client.get("/api/studies/editions/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		returned_ids = {item["id"] for item in response.data}
		self.assertIn(active.id, returned_ids)
		self.assertIn(closed.id, returned_ids)
		self.assertNotIn(hidden.id, returned_ids)

	def test_edition_retrieve_returns_404_for_hidden(self):
		hidden = create_edition(self.studies, status=StudiesEdition.Status.HIDDEN)

		response = self.client.get(f"/api/studies/editions/{hidden.id}/")

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_edition_staff_list_returns_data_for_public_edition(self):
		edition = create_edition(self.studies, status=StudiesEdition.Status.ACTIVE)
		employee_user = create_user("staff-public@example.com", is_employee=True)
		Employee.objects.create(user=employee_user)
		StudiesEditionStaff.objects.create(
			studies_edition=edition,
			user=employee_user,
			role=StudiesEditionStaff.Roles.STUDIES_DIRECTOR,
		)

		response = self.client.get(f"/api/studies/editions/{edition.id}/staff/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["role"], StudiesEditionStaff.Roles.STUDIES_DIRECTOR)


class StudiesAdminEndpointsTests(APITestCase):
	def setUp(self):
		self.studies = Studies.objects.create(
			name="Admin Studies",
			organizational_unit="Faculty",
			terms_count=2,
			description="Desc",
		)
		self.edition = create_edition(self.studies, status=StudiesEdition.Status.ACTIVE)
		self.other_edition = create_edition(self.studies, status=StudiesEdition.Status.ACTIVE)

		self.admin = create_user("admin@example.com", is_staff=True)
		self.employee = create_user("coordinator@example.com", is_employee=True)
		self.other_employee = create_user("other-coordinator@example.com", is_employee=True)
		Employee.objects.create(user=self.employee)
		Employee.objects.create(user=self.other_employee)

		StudiesEditionStaff.objects.create(
			studies_edition=self.edition,
			user=self.employee,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)
		StudiesEditionStaff.objects.create(
			studies_edition=self.other_edition,
			user=self.other_employee,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)

	def test_admin_studies_list_requires_admin(self):
		self.client.force_authenticate(self.employee)
		forbidden_response = self.client.get("/api/admin/studies/")

		self.client.force_authenticate(self.admin)
		ok_response = self.client.get("/api/admin/studies/")

		self.assertEqual(forbidden_response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(ok_response.status_code, status.HTTP_200_OK)

	def test_admin_editions_list_for_employee_is_scoped_to_assigned(self):
		self.client.force_authenticate(self.employee)
		response = self.client.get("/api/admin/studies/editions/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		returned_ids = {item["id"] for item in response.data}
		self.assertIn(self.edition.id, returned_ids)
		self.assertNotIn(self.other_edition.id, returned_ids)

	def test_admin_edition_documents_create_and_list(self):
		self.client.force_authenticate(self.employee)
		payload = {
			"name": "Regulamin",
			"required": True,
			"due_date": (timezone.now() + timedelta(days=10)).isoformat(),
			"is_read_only": False,
		}

		create_response = self.client.post(
			f"/api/admin/studies/editions/{self.edition.id}/documents/",
			payload,
			format="json",
		)
		list_response = self.client.get(f"/api/admin/studies/editions/{self.edition.id}/documents/")

		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertTrue(any(doc["name"] == "Regulamin" for doc in list_response.data))

	def test_cancel_edition_endpoint_for_admin(self):
		self.client.force_authenticate(self.admin)
		response = self.client.post(f"/api/admin/studies/editions/{self.edition.id}/cancel/", format="json")

		self.edition.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.edition.status, StudiesEdition.Status.CANCELLED)
