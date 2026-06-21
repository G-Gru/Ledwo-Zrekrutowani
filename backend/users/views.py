from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from studies.models import StudiesEditionStaff
from .models import User, WorkPhoneNumber
from .permissions import IsEmployee, IsObjectOwner
from .serializers import RegisterSerializer, LoginSerializer, EmployeeSerializer, \
    WorkPhoneNumberSerializer, ChangePasswordSerializer, CreateEmployeeSerializer


def _resolve_login_role(user: User) -> str:
    if user.is_staff:
        return "ADMIN"
    if not user.is_employee:
        if user.enrollment_set.filter(status="STUDENT").exists():
            return "STUDENT"
        return "CANDIDATE"

    # Return one specific role for EMPLOYEE user type.
    role_priority = (
        StudiesEditionStaff.Roles.STUDIES_DIRECTOR,
        StudiesEditionStaff.Roles.ADMINISTRATIVE_COORDINATOR,
        StudiesEditionStaff.Roles.FINANCE_COORDINATOR,
    )

    user_roles = set(
        user.studies_edition_staff.values_list("role", flat=True).distinct()
    )

    for role in role_priority:
        if role in user_roles:
            return role

    # Fallback: use the global role set on Employee model.
    if hasattr(user, 'employee') and user.employee.role:
        return user.employee.role

    return "UNASSIGNED_EMPLOYEE"


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer


class LoginAPIView(generics.CreateAPIView):
    serializer_class = LoginSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        # Backward-compatible type.
        user_type = "STUDENT"
        if user.is_staff:
            user_type = "ADMIN"
        elif user.is_employee:
            user_type = "EMPLOYEE"

        user_role = _resolve_login_role(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "phone": user.phone,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "type": user_type,   # backward-compatible # todo remove
                "role": user_role,   # specific: ADMIN/CANDIDATE/STUDENT/STUDIES_DIRECTOR/ADMINISTRATIVE_COORDINATOR/FINANCE_COORDINATOR
            }
        })

class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": _resolve_login_role(user),
        })

class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response({"old_password": "Niepoprawne hasło."}, status=400)

        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Hasło zostało zmienione."})


## ADMIN
class EmployeesListAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsEmployee]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateEmployeeSerializer
        return EmployeeSerializer

    def get_queryset(self):
        return (User.objects.all()
                .filter(is_employee=True)
                .select_related('employee')
                .prefetch_related('employee__work_phones')
                .order_by('last_name', 'first_name'))

    def perform_create(self, serializer):
        serializer.save()

class EmployeesPhonesCreateAPIView(generics.CreateAPIView):
    serializer_class = WorkPhoneNumberSerializer
    permission_classes = [IsAuthenticated, IsEmployee]

    def perform_create(self, serializer):
        user_id = self.kwargs['user_pk']

        if self.request.user.id != int(user_id):
            raise PermissionDenied()

        serializer.save(employee_id=self.request.user.id)

class EmployeesPhonesDestroyAPIView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsEmployee, IsObjectOwner]
    lookup_url_kwarg = 'phone_pk'

    def get_queryset(self):
        return WorkPhoneNumber.objects.filter(employee_id=self.request.user.id)

