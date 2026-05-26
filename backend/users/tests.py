from datetime import timedelta
from decimal import Decimal

from django.contrib.auth.models import AnonymousUser
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from rest_framework.test import APITestCase
from rest_framework import status

from studies.models import Studies, StudiesEdition, StudiesEditionStaff
from users.models import User, Employee, WorkPhoneNumber
from users.permissions import (
	IsDirectorOrAdministrativeCoordinator,
	IsEmployee,
	IsObjectOwner,
)
from users.views import _resolve_login_role


class DummyObject:
	def __init__(self, user):
		self.user = user


class DummyView:
	def __init__(self, kwargs=None):
		self.kwargs = kwargs or {}


def create_user(email, is_staff=False, is_employee=False):
	return User.objects.create(
		email=email,
		first_name="Perm",
		last_name="User",
		is_staff=is_staff,
		is_employee=is_employee,
	)


def create_edition():
	now = timezone.now()
	studies = Studies.objects.create(
		name="Permissions Studies",
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


class PermissionTests(TestCase):
	def setUp(self):
		self.factory = APIRequestFactory()

	def test_is_employee_permission(self):
		permission = IsEmployee()
		view = DummyView()

		request = self.factory.get("/")
		request.user = AnonymousUser()
		self.assertFalse(permission.has_permission(request, view))

		employee = create_user("employee@example.com", is_employee=True)
		request.user = employee
		self.assertTrue(permission.has_permission(request, view))

		student = create_user("student@example.com", is_employee=False)
		request.user = student
		self.assertFalse(permission.has_permission(request, view))

	def test_is_object_owner_permission(self):
		owner = create_user("owner@example.com")
		other = create_user("other@example.com")
		admin = create_user("admin@example.com", is_staff=True)
		obj = DummyObject(owner)
		permission = IsObjectOwner()
		view = DummyView()

		request = self.factory.get("/")
		request.user = owner
		self.assertTrue(permission.has_object_permission(request, view, obj))

		request.user = other
		self.assertFalse(permission.has_object_permission(request, view, obj))

		request.user = admin
		self.assertTrue(permission.has_object_permission(request, view, obj))

	def test_director_or_admin_coordinator_permission(self):
		edition = create_edition()
		user = create_user("coordinator@example.com", is_employee=True)
		request = self.factory.get("/")
		request.user = user
		permission = IsDirectorOrAdministrativeCoordinator()
		view = DummyView(kwargs={"edition_pk": edition.id})

		self.assertFalse(permission.has_permission(request, view))

		StudiesEditionStaff.objects.create(
			studies_edition=edition,
			user=user,
			role=StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
		)

		self.assertTrue(permission.has_permission(request, view))
		self.assertTrue(permission.has_object_permission(request, view, obj=None))


class AuthEndpointsTests(APITestCase):
	def test_register_endpoint_creates_user(self):
		payload = {
			"email": "register@example.com",
			"first_name": "Reg",
			"last_name": "User",
			"password": "Secret123!",
			"phone": "+48123123123",
		}

		response = self.client.post("/api/auth/register", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(User.objects.filter(email="register@example.com").exists())

	def test_login_endpoint_returns_tokens_and_candidate_role(self):
		user = create_user("login@example.com")
		user.set_password("MyPass123!")
		user.save(update_fields=["password"])

		response = self.client.post(
			"/api/auth/login",
			{"email": "login@example.com", "password": "MyPass123!"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn("access", response.data)
		self.assertIn("refresh", response.data)
		self.assertEqual(response.data["user"]["role"], "CANDIDATE")

	def test_change_password_endpoint(self):
		user = create_user("password@example.com")
		user.set_password("OldPass123!")
		user.save(update_fields=["password"])

		self.client.force_authenticate(user)
		response = self.client.post(
			"/api/auth/change-password",
			{"old_password": "OldPass123!", "new_password": "NewPass123!"},
			format="json",
		)

		user.refresh_from_db()
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(user.check_password("NewPass123!"))


class UsersAdminEndpointsTests(APITestCase):
	def setUp(self):
		self.employee = create_user("employees-admin@example.com")
		self.employee.is_employee = True
		self.employee.save(update_fields=["is_employee"])
		Employee.objects.create(user=self.employee)

		self.other_employee = create_user("employees-other@example.com")
		self.other_employee.is_employee = True
		self.other_employee.save(update_fields=["is_employee"])
		Employee.objects.create(user=self.other_employee)

	def test_employees_list_requires_employee_permission(self):
		response_anon = self.client.get("/api/admin/users/employees/")

		student = create_user("student-no-access@example.com")
		self.client.force_authenticate(student)
		response_student = self.client.get("/api/admin/users/employees/")

		self.client.force_authenticate(self.employee)
		response_employee = self.client.get("/api/admin/users/employees/")

		self.assertEqual(response_anon.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(response_student.status_code, status.HTTP_403_FORBIDDEN)
		self.assertEqual(response_employee.status_code, status.HTTP_200_OK)

	def test_employees_create_endpoint(self):
		self.client.force_authenticate(self.employee)
		payload = {
			"first_name": "Nowy",
			"last_name": "Pracownik",
			"email": "new-employee@example.com",
			"phone": "123456789",
			"password": "EmpPass123!",
		}

		response = self.client.post("/api/admin/users/employees/", payload, format="json")

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		created = User.objects.get(email="new-employee@example.com")
		self.assertTrue(created.is_employee)
		self.assertTrue(Employee.objects.filter(user=created).exists())

	def test_employee_phone_create_and_delete_for_self(self):
		self.client.force_authenticate(self.employee)
		create_response = self.client.post(
			f"/api/admin/users/employees/{self.employee.id}/phones/",
			{"phone": "987654321"},
			format="json",
		)

		self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
		phone_id = create_response.data["id"]
		self.assertTrue(WorkPhoneNumber.objects.filter(id=phone_id).exists())

		delete_response = self.client.delete(f"/api/admin/users/phones/{phone_id}/")
		self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
		self.assertFalse(WorkPhoneNumber.objects.filter(id=phone_id).exists())

	def test_employee_phone_create_for_other_user_is_forbidden(self):
		self.client.force_authenticate(self.employee)
		response = self.client.post(
			f"/api/admin/users/employees/{self.other_employee.id}/phones/",
			{"phone": "111222333"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class LoginRoleResolutionTests(TestCase):
	def setUp(self):
		self.studies = Studies.objects.create(
			name="Role Studies",
			organizational_unit="Unit",
			terms_count=2,
			description="Desc",
		)
		now = timezone.now()
		self.edition = StudiesEdition.objects.create(
			studies=self.studies,
			price=Decimal("1000.00"),
			start_date=(now + timedelta(days=60)).date(),
			end_date=(now + timedelta(days=120)).date(),
			max_participants=10,
			status=StudiesEdition.Status.ACTIVE,
			syllabus_url="https://example.com/syllabus",
			recruitment_start_date=now - timedelta(days=1),
			recruitment_end_date=now + timedelta(days=30),
			academic_year="2026/2027",
		)

	def test_employee_role_priority(self):
		user = create_user("role-employee@example.com", is_employee=True)
		StudiesEditionStaff.objects.create(
			studies_edition=self.edition,
			user=user,
			role=StudiesEditionStaff.Roles.FINANCE_COORDINATOR,
		)
		StudiesEditionStaff.objects.create(
			studies_edition=self.edition,
			user=user,
			role=StudiesEditionStaff.Roles.STUDIES_DIRECTOR,
		)

		self.assertEqual(_resolve_login_role(user), StudiesEditionStaff.Roles.STUDIES_DIRECTOR)

	def test_employee_without_assignment_gets_unassigned_role(self):
		user = create_user("role-unassigned@example.com", is_employee=True)
		self.assertEqual(_resolve_login_role(user), "UNASSIGNED_EMPLOYEE")
