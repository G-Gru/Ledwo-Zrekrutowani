from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from enrollments.models import Enrollment
from payments.models import Fee, Payment, PaymentHistory
from payments.services import approve_payment, pay_fee
from studies.models import Studies, StudiesEdition, StudiesEditionStaff
from users.models import Employee
from users.models import User


def create_user(email):
	return User.objects.create(
		email=email,
		first_name="Pay",
		last_name="User",
	)


def create_edition():
	now = timezone.now()
	studies = Studies.objects.create(
		name="Payments Studies",
		organizational_unit="Unit",
		terms_count=2,
		description="Desc",
	)
	return StudiesEdition.objects.create(
		studies=studies,
		price=Decimal("3000.00"),
		start_date=(now + timedelta(days=60)).date(),
		end_date=(now + timedelta(days=120)).date(),
		max_participants=20,
		status=StudiesEdition.Status.ACTIVE,
		syllabus_url="https://example.com/syllabus",
		recruitment_start_date=now - timedelta(days=1),
		recruitment_end_date=now + timedelta(days=30),
		academic_year="2026/2027",
	)


class PaymentsServicesTests(TestCase):
	def setUp(self):
		self.user = create_user("pay@example.com")
		self.edition = create_edition()
		self.enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)
		self.fee = Fee.objects.create(
			enrollment=self.enrollment,
			title="Oplata rekrutacyjna",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=7),
		)

	@patch("enrollments.services.check_and_promote_candidate_to_student")
	@patch("payments.services.send_payment_confirmation_notif")
	def test_pay_fee_without_file_marks_completed(self, mock_send_notif, mock_promote):
		pay_fee(self.fee)

		payment = Payment.objects.get(fee=self.fee)
		self.fee.refresh_from_db()

		self.assertEqual(payment.status, "COMPLETED")
		self.assertEqual(payment.payment_method, "ONLINE")
		self.assertIsNotNone(self.fee.paid_date)
		self.assertTrue(PaymentHistory.objects.filter(payment=payment, new_status="COMPLETED").exists())
		mock_send_notif.assert_called_once_with(self.fee)
		mock_promote.assert_called_once_with(self.enrollment)

	@patch("enrollments.services.check_and_promote_candidate_to_student")
	@patch("payments.services.send_payment_confirmation_notif")
	def test_pay_fee_with_file_sets_pending_and_keeps_unpaid(self, mock_send_notif, mock_promote):
		proof = SimpleUploadedFile("proof.pdf", b"binary", content_type="application/pdf")

		pay_fee(self.fee, proof_file=proof)

		payment = Payment.objects.get(fee=self.fee)
		self.fee.refresh_from_db()

		self.assertEqual(payment.status, "PENDING")
		self.assertEqual(payment.payment_method, "TRANSFER")
		self.assertIsNotNone(payment.file_id)
		self.assertIsNone(self.fee.paid_date)
		mock_send_notif.assert_not_called()
		mock_promote.assert_not_called()

	@patch("enrollments.services.check_and_promote_candidate_to_student")
	@patch("payments.services.send_payment_confirmation_notif")
	def test_approve_payment_updates_status_and_fee(self, mock_send_notif, mock_promote):
		payment = Payment.objects.create(
			fee=self.fee,
			payment_method="TRANSFER",
			reference_number=67,
			status="PENDING",
		)

		approve_payment(payment)
		payment.refresh_from_db()
		self.fee.refresh_from_db()

		self.assertEqual(payment.status, "COMPLETED")
		self.assertIsNotNone(self.fee.paid_date)
		self.assertTrue(
			PaymentHistory.objects.filter(
				payment=payment,
				previous_status="PENDING",
				new_status="COMPLETED",
			).exists()
		)
		mock_send_notif.assert_called_once_with(self.fee)
		mock_promote.assert_called_once_with(self.enrollment)


class PaymentsEndpointsTests(APITestCase):
	def setUp(self):
		self.user = create_user("payments-api@example.com")
		self.other_user = create_user("payments-other@example.com")
		self.edition = create_edition()
		self.enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)
		self.other_enrollment = Enrollment.objects.create(
			user=self.other_user,
			studies_edition=self.edition,
			status=Enrollment.Status.DRAFT,
		)

	def test_upcoming_and_history_filter_by_paid_date_and_user(self):
		upcoming = Fee.objects.create(
			enrollment=self.enrollment,
			title="Upcoming",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=5),
		)
		paid = Fee.objects.create(
			enrollment=self.enrollment,
			title="Paid",
			amount=Decimal("200.00"),
			due_date=timezone.now().date() - timedelta(days=1),
			paid_date=timezone.now().date(),
		)
		Fee.objects.create(
			enrollment=self.other_enrollment,
			title="Foreign",
			amount=Decimal("999.00"),
			due_date=timezone.now().date() + timedelta(days=2),
		)

		self.client.force_authenticate(self.user)
		upcoming_response = self.client.get("/api/payments/upcoming/")
		history_response = self.client.get("/api/payments/history/")

		self.assertEqual(upcoming_response.status_code, status.HTTP_200_OK)
		self.assertEqual(history_response.status_code, status.HTTP_200_OK)
		self.assertEqual([item["id"] for item in upcoming_response.data], [upcoming.id])
		self.assertEqual([item["id"] for item in history_response.data], [paid.id])

	@patch("payments.services.send_payment_confirmation_notif")
	@patch("enrollments.services.check_and_promote_candidate_to_student")
	def test_pay_fee_endpoint_marks_fee_as_paid(self, _mock_promote, _mock_notif):
		fee = Fee.objects.create(
			enrollment=self.enrollment,
			title="To pay",
			amount=Decimal("50.00"),
			due_date=timezone.now().date() + timedelta(days=3),
		)

		self.client.force_authenticate(self.user)
		response = self.client.post(f"/api/payments/{fee.id}/pay/")

		fee.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsNotNone(fee.paid_date)

	def test_pay_fee_endpoint_returns_400_for_already_paid_fee(self):
		fee = Fee.objects.create(
			enrollment=self.enrollment,
			title="Paid already",
			amount=Decimal("50.00"),
			due_date=timezone.now().date(),
			paid_date=timezone.now().date(),
		)

		self.client.force_authenticate(self.user)
		response = self.client.post(f"/api/payments/{fee.id}/pay/")

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminPaymentsEndpointsTests(APITestCase):
	def setUp(self):
		self.employee = create_user("finance@example.com")
		self.employee.is_employee = True
		self.employee.save(update_fields=["is_employee"])
		Employee.objects.create(user=self.employee)

		self.edition = create_edition()
		self.other_edition = create_edition()
		StudiesEditionStaff.objects.create(
			studies_edition=self.edition,
			user=self.employee,
			role=StudiesEditionStaff.Roles.FINANCE_COORDINATOR,
		)

		self.user = create_user("finance-student@example.com")
		self.other_user = create_user("finance-other-student@example.com")

		enrollment = Enrollment.objects.create(
			user=self.user,
			studies_edition=self.edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)
		other_enrollment = Enrollment.objects.create(
			user=self.other_user,
			studies_edition=self.other_edition,
			status=Enrollment.Status.CANDIDATE,
			enrollment_date=timezone.now(),
		)

		self.fee = Fee.objects.create(
			enrollment=enrollment,
			title="Scoped fee",
			amount=Decimal("100.00"),
			due_date=timezone.now().date() + timedelta(days=3),
		)
		self.other_fee = Fee.objects.create(
			enrollment=other_enrollment,
			title="Unscoped fee",
			amount=Decimal("200.00"),
			due_date=timezone.now().date() + timedelta(days=3),
		)
		self.pending_payment = Payment.objects.create(
			fee=self.fee,
			payment_method="TRANSFER",
			reference_number=67,
			status="PENDING",
		)
		Payment.objects.create(
			fee=self.other_fee,
			payment_method="TRANSFER",
			reference_number=68,
			status="PENDING",
		)

	def test_admin_fees_and_transactions_are_scoped(self):
		self.client.force_authenticate(self.employee)
		fees_response = self.client.get("/api/admin/finances/fees/")
		transactions_response = self.client.get("/api/admin/finances/transactions/")

		self.assertEqual(fees_response.status_code, status.HTTP_200_OK)
		self.assertEqual(transactions_response.status_code, status.HTTP_200_OK)
		fee_ids = {item["id"] for item in fees_response.data}
		self.assertIn(self.fee.id, fee_ids)
		self.assertNotIn(self.other_fee.id, fee_ids)
		self.assertEqual([item["id"] for item in transactions_response.data], [self.pending_payment.id])

	def test_admin_dashboard_returns_aggregates(self):
		self.client.force_authenticate(self.employee)
		response = self.client.get("/api/admin/finances/dashboard/")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("overall", response.data)
		self.assertIn("by_edition", response.data)
		self.assertEqual(len(response.data["by_edition"]), 1)

	@patch("payments.services.send_payment_confirmation_notif")
	@patch("enrollments.services.check_and_promote_candidate_to_student")
	def test_admin_approve_pending_payment(self, _mock_promote, _mock_notif):
		self.client.force_authenticate(self.employee)
		response = self.client.post(
			f"/api/admin/finances/transactions/{self.pending_payment.id}/approve/",
			format="json",
		)

		self.pending_payment.refresh_from_db()
		self.fee.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(self.pending_payment.status, "COMPLETED")
		self.assertIsNotNone(self.fee.paid_date)

	def test_admin_approve_non_pending_payment_returns_400(self):
		self.pending_payment.status = "COMPLETED"
		self.pending_payment.save(update_fields=["status"])

		self.client.force_authenticate(self.employee)
		response = self.client.post(
			f"/api/admin/finances/transactions/{self.pending_payment.id}/approve/",
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
