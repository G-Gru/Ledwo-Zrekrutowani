from datetime import timedelta
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from files.models import File, file_upload_path
from enrollments.models import Enrollment, SubmittedDocument
from studies.models import Studies, StudiesDocument, StudiesEdition
from users.models import User


class DummyInstance:
	def __init__(self, source):
		self.source = source


class FilesModelTests(TestCase):
	def test_file_upload_path_uses_lowercase_source(self):
		instance = DummyInstance(File.Source.SUBMITTED)

		path = file_upload_path(instance, "document.pdf")

		self.assertEqual(path, "submitted/document.pdf")

	def test_file_source_choices_exist(self):
		self.assertIn(("SUBMITTED", "Submitted"), File.Source.choices)
		self.assertIn(("PAYMENT", "Payment"), File.Source.choices)


def create_user(email):
	return User.objects.create(
		email=email,
		first_name="File",
		last_name="User",
	)


def create_edition():
	now = timezone.now()
	studies = Studies.objects.create(
		name="Files Studies",
		organizational_unit="Unit",
		terms_count=2,
		description="Desc",
	)
	return StudiesEdition.objects.create(
		studies=studies,
		price=Decimal("1000.00"),
		start_date=(now + timedelta(days=60)).date(),
		end_date=(now + timedelta(days=120)).date(),
		max_participants=20,
		status=StudiesEdition.Status.ACTIVE,
		syllabus_url="https://example.com/syllabus",
		recruitment_start_date=now - timedelta(days=1),
		recruitment_end_date=now + timedelta(days=30),
		academic_year="2026/2027",
	)


class FileDownloadEndpointsTests(APITestCase):
	def setUp(self):
		self.owner = create_user("owner-file@example.com")
		self.other = create_user("other-file@example.com")
		edition = create_edition()
		enrollment = Enrollment.objects.create(
			user=self.owner,
			studies_edition=edition,
			status=Enrollment.Status.DRAFT,
		)
		document = StudiesDocument.objects.create(
			studies_edition=edition,
			name="Dowod",
			required=True,
			due_date=timezone.now() + timedelta(days=7),
			is_read_only=False,
		)
		self.file_obj = File.objects.create(
			file=SimpleUploadedFile("evidence.pdf", b"content", content_type="application/pdf"),
			source=File.Source.SUBMITTED,
		)
		SubmittedDocument.objects.create(
			studies_document=document,
			enrollment=enrollment,
			file=self.file_obj,
		)

	def test_file_download_requires_authentication(self):
		response = self.client.get(f"/api/files/{self.file_obj.id}/")

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_file_download_allowed_for_owner(self):
		self.client.force_authenticate(self.owner)
		response = self.client.get(f"/api/files/{self.file_obj.id}/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("Content-Disposition", response.headers)

	def test_file_download_forbidden_for_other_user(self):
		self.client.force_authenticate(self.other)
		response = self.client.get(f"/api/files/{self.file_obj.id}/")

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
