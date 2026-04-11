from rest_framework.routers import DefaultRouter

from .views import AdminEnrollmentViewSet

router = DefaultRouter()
router.register(r"", AdminEnrollmentViewSet, basename="admin-enrollments")

urlpatterns = router.urls
