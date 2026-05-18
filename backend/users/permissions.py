from rest_framework import permissions
from rest_framework.permissions import BasePermission

from files.models import File
from studies.models import StudiesEditionStaff, StudiesEdition


class IsEmployee(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff:  # Admin
            return True

        return request.user.is_employee_user()


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.is_student_user()

class IsObjectOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff: #Admin
            return True

        return obj.user == request.user

class CanViewDocument(BasePermission):
    def has_object_permission(self, request, view, obj: File):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff: #Admin
            return True

        if obj.source == File.Source.SUBMITTED:
            if obj.submitted_document.enrollment.user == request.user:
                return True

            edition = StudiesEdition.objects.get(
                pk=obj.submitted_document.studies_document.studies_edition_id
            )

            return (StudiesEditionStaff.objects
                    .filter(studies_edition=edition, user=request.user)
                    .exists())

        elif obj.source == File.Source.PAYMENT:
            enrollment = obj.payment.fee.enrollment
            if enrollment.user == request.user:
                return True

            edition = StudiesEdition.objects.get(pk=enrollment.studies_edition_id)
            return (StudiesEditionStaff.objects
                    .filter(studies_edition=edition, user=request.user)
                    .exists())


class IsEditionStaffWithRole(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff: #Admin
            return True

        return request.user.studies_edition_staff.filter(
            role__in=self.allowed_roles
        ).exists()

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_staff: #Admin
            return True

        edition_id = view.kwargs.get("edition_pk")
        if edition_id is None:
            return False

        return request.user.studies_edition_staff.filter(
            studies_edition_id=edition_id,
            role__in=self.allowed_roles
        ).exists()


class IsStudiesDirector(IsEditionStaffWithRole):
    allowed_roles = [StudiesEditionStaff.Roles.STUDIES_DIRECTOR]

class IsAdministrativeCoordinator(IsEditionStaffWithRole):
    allowed_roles = [StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR]

class IsFinanceCoordinator(IsEditionStaffWithRole):
    allowed_roles = [StudiesEditionStaff.Roles.FINANCE_COORDINATOR]

class IsCoordinator(IsEditionStaffWithRole):
    allowed_roles = [
        StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
        StudiesEditionStaff.Roles.FINANCE_COORDINATOR,
    ]

class IsDirectorOrAdministrativeCoordinator(IsEditionStaffWithRole):
    allowed_roles = [
        StudiesEditionStaff.Roles.STUDIES_DIRECTOR,
        StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
    ]

class IsDirectorOrCoordinator(IsEditionStaffWithRole):
    allowed_roles = [
        StudiesEditionStaff.Roles.STUDIES_DIRECTOR,
        StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
        StudiesEditionStaff.Roles.FINANCE_COORDINATOR,
    ]