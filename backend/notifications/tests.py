from unittest.mock import patch

from rest_framework import status
from rest_framework.test import APITestCase

from users.models import User


def create_user(email, is_employee=False, is_staff=False):
	return User.objects.create(
		email=email,
		first_name="Notif",
		last_name="User",
		is_employee=is_employee,
		is_staff=is_staff,
	)


class NotificationAdminEndpointsTests(APITestCase):
	def setUp(self):
		self.employee = create_user("notifier@example.com", is_employee=True)
		self.recipient = create_user("recipient@example.com")

	def test_send_notification_requires_employee(self):
		payload = {
			"emails": [self.recipient.email],
			"notification_subject": "Test",
			"notification_body": "Body",
			"use_own_name_as_sender": True,
		}
		response_anon = self.client.post("/api/admin/notifications/new/", payload, format="json")

		student = create_user("plain-user@example.com")
		self.client.force_authenticate(student)
		response_student = self.client.post("/api/admin/notifications/new/", payload, format="json")

		self.assertEqual(response_anon.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)

	@patch("notifications.views.send_notif_to")
	def test_send_notification_success(self, mock_send):
		self.client.force_authenticate(self.employee)
		payload = {
			"emails": [self.recipient.email],
			"notification_subject": "Test",
			"notification_body": "Body",
			"use_own_name_as_sender": True,
		}
		response = self.client.post("/api/admin/notifications/new/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data["sent_count"], 1)
		self.assertEqual(response.data["failed_emails"], [])
		mock_send.assert_called_once()

	@patch("notifications.views.send_notif_to")
	def test_send_notification_partial_failure_for_unknown_email(self, mock_send):
		self.client.force_authenticate(self.employee)
		payload = {
			"emails": [self.recipient.email, "missing@example.com"],
			"notification_subject": "Test",
			"notification_body": "Body",
			"use_own_name_as_sender": False,
		}
		response = self.client.post("/api/admin/notifications/new/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_207_MULTI_STATUS)
		self.assertEqual(response.data["sent_count"], 1)
		self.assertIn("missing@example.com", response.data["failed_emails"])
		mock_send.assert_called_once()
