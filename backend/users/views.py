from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer, UserSerializer

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = serializer.save()
                token = get_tokens_for_user(user)
                return Response({
                    "token": token,
                    "user": UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        # Złączenie błędów walidacji z serializer do string
        errors = [str(err) for error_list in serializer.errors.values() for err in error_list]
        error_msg = errors[0] if errors else "Niepoprawne dane."
        return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = get_tokens_for_user(user)
            return Response({
                "token": token,
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Niepoprawne dane logowania."}, status=status.HTTP_400_BAD_REQUEST)
