from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AdminEnrollmentViewSet

router = DefaultRouter()
router.register(r'admin/enrollments', AdminEnrollmentViewSet, basename='admin-enrollments')

urlpatterns = [
    path('', include(router.urls)),
]
