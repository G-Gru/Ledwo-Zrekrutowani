from datetime import date, datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from enrollments.models import Address, Enrollment, SubmittedDocument
from enrollments.services import check_and_promote_candidate_to_student, resign
from enrollments.validators import (
	is_at_least_18,
	is_valid_education_year,
	is_valid_pesel,
	is_valid_phone,
	pesel_to_birthdate,
)
from files.models import File
from payments.models import Fee
from studies.models import Studies, StudiesDocument, StudiesEdition
from studies.models import StudiesEditionStaff
from users.models import Employee
from users.models import User


def create_edition(status=StudiesEdition.Status.ACTIVE, max_participants=20):
	now = timezone.now()
	studies = Studies.objects.create(
		name="Test Studies",
		organizational_unit="Unit",
		terms_count=2,
		description="Desc",
	)
	return StudiesEdition.objects.create(
		studies=studies,
		price=Decimal("1500.00"),
		start_date=(now + timedelta(days=60)).date(),
		end_date=(now + timedelta(days=120)).date(),
		max_participants=max_participants,
		status=status,
		syllabus_url="https://example.com/syllabus",
		recruitment_start_date=now - timedelta(days=1),
		recruitment_end_date=now + timedelta(days=30),
		academic_year="2026/2027",
	)


def create_user(email):
	return User.objects.create(
		email=email,
		first_name="Jan",
		last_name="Kowalski",
	)


class EnrollmentValidatorsTests(TestCase):
	def test_pesel_validation_accepts_valid_number(self):
		self.assertTrue(is_valid_pesel("44051401458"))

	def test_pesel_to_birthdate_parses_2000_century(self):
		self.assertEqual(pesel_to_birthdate("04222999995"), date(2004, 2, 29))

	def test_phone_and_education_year_validation(self):
		self.assertTrue(is_valid_phone("+48 123 456 789"))
		self.assertFalse(is_valid_phone("abc"))
		self.assertTrue(is_valid_education_year(str(date.today().year)))
		self.assertFalse(is_valid_education_year("1899"))

	def test_is_at_least_18(self):
		today = date.today()
		try:
			eighteenth_birthday = today.replace(year=today.year - 18)
		except ValueError:
			eighteenth_birthday = today.replace(month=2, day=28, year=today.year - 18)

		adult_birthdate = eighteenth_birthday - timedelta(days=1)
		child_birthdate = eighteenth_birthday + timedelta(days=1)
		self.assertTrue(is_at_least_18(adult_birthdate))
		self.assertFalse(is_at_least_18(child_birthdate))


class EnrollmentServicesTests(TestCase):
	def setUp(self):
		self.edition = create_edition()
		self.user = create_user("candidate@example.com")

	def _create_candidate_enrollment(self, user=None, status=Enrollment.Status.CANDIDATE):
		return Enrollment.objects.create(
			user=user or self.user,
			studies_edition=self.edition,
			status=status,
			enrollment_date=timezone.now(),
		)

	def _add_required_confirmed_document(self, enrollment):
		studies_document = StudiesDocument.objects.create(
			studies_edition=self.edition,
			name="Dowod",
			required=True,
			due_date=timezone.now() + timedelta(days=7),
			is_read_only=False,
		)
		file_obj = File.objects.create(
			file=SimpleUploadedFile("doc.pdf", b"abc", content_type="application/pdf"),
			source=File.Source.SUBMITTED,
		)
		SubmittedDocument.objects.create(
			studies_document=studies_document,
			enrollment=enrollment,
			file=file_obj,
			status=SubmittedDocument.Status.ACCEPTED,
		)

	def test_check_and_promote_candidate_to_student_when_requirements_met(self):
		enrollment = self._create_candidate_enrollment()
		Fee.objects.filter(enrollment=enrollment, paid_date__isnull=True).update(
			paid_date=timezone.now().date()
		)
		Fee.objects.create(
			enrollment=enrollment,
			title="Czesne",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=7),
			paid_date=timezone.now().date(),
		)
		self._add_required_confirmed_document(enrollment)

		check_and_promote_candidate_to_student(enrollment)
		enrollment.refresh_from_db()

		self.assertEqual(enrollment.status, Enrollment.Status.STUDENT)

	def test_check_and_promote_candidate_to_student_does_not_promote_unpaid(self):
		enrollment = self._create_candidate_enrollment()
		Fee.objects.create(
			enrollment=enrollment,
			title="Czesne",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=7),
		)
		self._add_required_confirmed_document(enrollment)

		check_and_promote_candidate_to_student(enrollment)
		enrollment.refresh_from_db()

		self.assertEqual(enrollment.status, Enrollment.Status.CANDIDATE)

	def test_resign_from_active_recruitment_rejects_and_promotes_reserve(self):
		candidate = self._create_candidate_enrollment(status=Enrollment.Status.CANDIDATE)
		reserve_user = create_user("reserve@example.com")
		reserve = self._create_candidate_enrollment(
			user=reserve_user,
			status=Enrollment.Status.RESERVE,
		)
		reserve.enrollment_date = timezone.make_aware(datetime(2026, 1, 1))
		reserve.save(update_fields=["enrollment_date"])

		resign(candidate)
		candidate.refresh_from_db()
		reserve.refresh_from_db()

		self.assertEqual(candidate.status, Enrollment.Status.REJECTED)
		self.assertEqual(reserve.status, Enrollment.Status.CANDIDATE)

	def test_resign_after_recruitment_close_marks_expelled(self):
		self.edition.status = StudiesEdition.Status.CLOSED
		self.edition.save(update_fields=["status"])

		candidate = self._create_candidate_enrollment(status=Enrollment.Status.CANDIDATE)

		resign(candidate)
		candidate.refresh_from_db()

		self.assertEqual(candidate.status, Enrollment.Status.EXPELLED)


class EnrollmentEndpointsTests(APITestCase):
	def setUp(self):
		self.user = create_user("api-student@example.com")
		self.other_user = create_user("other-student@example.com")
		self.edition = create_edition(status=StudiesEdition.Status.ACTIVE)

	def test_addresses_requires_authentication(self):
		response = self.client.get("/api/enrollments/addresses/")

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_addresses_create_and_list_only_current_user(self):
		Address.objects.create(
			user=self.other_user,
			street="Other",
			house_number="99",
			flat_number="",
			city="Warsaw",
			country="PL",
			postal_code="00-999",
		)

		self.client.force_authenticate(self.user)
		payload = {
			"street": "Main",
			"house_number": "1",
			"flat_number": "2",
			"city": "Krakow",
			"country": "PL",
			"postal_code": "30-001",
		}

		create_response = self.client.post("/api/enrollments/addresses/", payload, format="json")
		list_response = self.client.get("/api/enrollments/addresses/")

		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(list_response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(list_response.data), 1)
		self.assertEqual(list_response.data[0]["street"], "Main")

	def test_enrollment_list_returns_only_current_user(self):
		own_enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)
		Enrollment.objects.create(
			user=self.other_user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)

		self.client.force_authenticate(self.user)
		response = self.client.get("/api/enrollments/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["id"], own_enrollment.id)

	def test_enrollment_delete_marks_status_not_delete_row(self):
		enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)

		self.client.force_authenticate(self.user)
		response = self.client.delete(f"/api/enrollments/{enrollment.id}/")

		enrollment.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertEqual(enrollment.status, Enrollment.Status.REJECTED)

	def test_fees_list_returns_only_fees_for_owner(self):
		enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)
		other_enrollment = Enrollment.objects.create(
			user=self.other_user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)
		Fee.objects.create(
			enrollment=enrollment,
			title="Own fee",
			amount=Decimal("50.00"),
			due_date=timezone.now().date() + timedelta(days=7),
		)
		Fee.objects.create(
			enrollment=other_enrollment,
			title="Other fee",
			amount=Decimal("60.00"),
			due_date=timezone.now().date() + timedelta(days=7),
		)

		self.client.force_authenticate(self.user)
		response = self.client.get(f"/api/enrollments/{enrollment.id}/fees/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(len(response.data), 1)
		self.assertEqual(response.data[0]["title"], "Own fee")


class AdminEnrollmentEndpointsTests(APITestCase):
	def setUp(self):
		self.employee = create_user("admin-emp@example.com")
		self.employee.is_employee = True
		self.employee.save(update_fields=["is_employee"])
		Employee.objects.create(user=self.employee)

		self.edition = create_edition(status=StudiesEdition.Status.ACTIVE)
		self.other_edition = create_edition(status=StudiesEdition.Status.ACTIVE)

		StudiesEditionStaff.objects.create(
			studies_edition=self.edition,
			user=self.employee,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)

		self.user = create_user("candidate-admin@example.com")
		self.other_user = create_user("candidate-other-admin@example.com")

		self.enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)
		self.other_enrollment = Enrollment.objects.create(
			user=self.other_user,
			studies_edition=self.other_edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)

		self.required_doc = StudiesDocument.objects.create(
			studies_edition=self.edition,
			name="Dyplom",
			required=True,
			due_date=timezone.now() + timedelta(days=7),
			is_read_only=False,
		)
		self.submitted_file = File.objects.create(
			file=SimpleUploadedFile("admin_doc.pdf", b"x", content_type="application/pdf"),
			source=File.Source.SUBMITTED,
		)
		self.submitted_doc = SubmittedDocument.objects.create(
			studies_document=self.required_doc,
			enrollment=self.enrollment,
			file=self.submitted_file,
		)

	def test_admin_enrollments_list_is_scoped_for_employee(self):
		self.client.force_authenticate(self.employee)
		response = self.client.get("/api/admin/enrollments/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		returned_ids = {item["id"] for item in response.data}
		self.assertIn(self.enrollment.id, returned_ids)
		self.assertNotIn(self.other_enrollment.id, returned_ids)

	def test_admin_accept_and_reject_actions_change_status(self):
		self.client.force_authenticate(self.employee)
		accept_response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/accept/",
			{"status_note": "OK"},
			format="json",
		)
		self.enrollment.refresh_from_db()

		self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.enrollment.status, Enrollment.Status.STUDENT)

		reject_response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/reject/",
			{"status_note": "NOK"},
			format="json",
		)
		self.enrollment.refresh_from_db()

		self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.enrollment.status, Enrollment.Status.EXPELLED)

	@patch("enrollments.views.send_notif_to")
	def test_admin_send_payment_reminder(self, mock_send_notif):
		Fee.objects.create(
			enrollment=self.enrollment,
			title="Unpaid",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=3),
		)

		self.client.force_authenticate(self.employee)
		response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/send-payment-reminder/",
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		mock_send_notif.assert_called_once()

	def test_admin_send_payment_reminder_returns_400_when_no_unpaid(self):
		Fee.objects.filter(enrollment=self.enrollment).update(paid_date=timezone.now().date())

		self.client.force_authenticate(self.employee)
		response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/send-payment-reminder/",
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

	@patch("enrollments.services.check_and_promote_candidate_to_student")
	def test_admin_document_accept_and_reject_endpoints(self, _mock_promote):
		self.client.force_authenticate(self.employee)
		accept_response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/documents/{self.submitted_doc.id}/accept/",
			{"note": "Looks good"},
			format="json",
		)
		self.submitted_doc.refresh_from_db()
		self.assertEqual(accept_response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.submitted_doc.status, SubmittedDocument.Status.ACCEPTED)

		reject_response = self.client.post(
			f"/api/admin/enrollments/{self.enrollment.id}/documents/{self.submitted_doc.id}/reject/",
			{"note": "Invalid"},
			format="json",
		)
		self.submitted_doc.refresh_from_db()
		self.assertEqual(reject_response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.submitted_doc.status, SubmittedDocument.Status.REJECTED)

	def test_admin_recruitment_stats_and_usos_export(self):
		Fee.objects.create(
			enrollment=self.enrollment,
			title="Fee",
			amount=Decimal("120.00"),
			due_date=timezone.now().date() + timedelta(days=2),
		)

		self.client.force_authenticate(self.employee)
		stats_response = self.client.get("/api/admin/enrollments/recruitment-stats/")
		export_response = self.client.get("/api/admin/enrollments/usos-export/")

		self.assertEqual(stats_response.status_code, status.HTTP_200_OK)
		self.assertEqual(export_response.status_code, status.HTTP_200_OK)
		self.assertGreaterEqual(len(stats_response.data), 1)
		self.assertEqual(len(export_response.data), 1)
