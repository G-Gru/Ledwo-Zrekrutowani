from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, WorkPhoneNumber
from .permissions import IsEmployee, IsObjectOwner
from .serializers import RegisterSerializer, LoginSerializer, EmployeeSerializer, \
    WorkPhoneNumberSerializer


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = RegisterSerializer

class LoginAPIView(generics.CreateAPIView):
    serializer_class = LoginSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

## ADMIN
class EmployeesListAPIView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsEmployee]

    def get_queryset(self):
        return (User.objects.all()
                .filter(is_employee=True)
                .select_related('employee')
                .prefetch_related('employee__work_phones')
                .order_by('last_name', 'first_name'))

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

