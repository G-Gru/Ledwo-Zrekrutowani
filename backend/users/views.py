from rest_framework import generics
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer
from .permissions import IsDirectorOrAdministrativeCoordinator

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


class UserListAdminAPIView(generics.ListAPIView):
    queryset = User.objects.all().order_by('last_name', 'first_name')
    serializer_class = UserSerializer
    permission_classes = [IsDirectorOrAdministrativeCoordinator]
