from django.urls import path
from .views import LoginAPIView, RegisterAPIView, EmployeesListAPIView, EmployeesPhonesCreateAPIView, \
    EmployeesPhonesDestroyAPIView

urlpatterns = [
    path('employees/',
         EmployeesListAPIView.as_view(),
         name="employees-list"),
    path('employees/<int:user_pk>/phones/',
         EmployeesPhonesCreateAPIView.as_view(),
         name="employees-phones-create"),
    path('phones/<int:phone_pk>/',
         EmployeesPhonesDestroyAPIView.as_view(),
         name="phones-destroy"),
]