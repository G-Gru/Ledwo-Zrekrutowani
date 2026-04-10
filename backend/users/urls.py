from django.urls import path
from .views import LoginAPIView, RegisterAPIView, UserListAdminAPIView

urlpatterns = [
    path('register', RegisterAPIView.as_view(), name='register'),
    path('login', LoginAPIView.as_view(), name='login'),
    path('users/', UserListAdminAPIView.as_view(), name='users-list'),
]