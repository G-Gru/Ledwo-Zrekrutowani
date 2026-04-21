from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import AdminEnrollmentViewSet, AdminDocumentAcceptAPIView, AdminDocumentRejectAPIView

router = DefaultRouter()
router.register(r"", AdminEnrollmentViewSet, basename="admin-enrollments")

urlpatterns = [
    path("<int:enrollment_pk>/documents/<int:document_pk>/accept/", 
         AdminDocumentAcceptAPIView.as_view(), 
         name="admin-document-accept"),
    path("<int:enrollment_pk>/documents/<int:document_pk>/reject/", 
         AdminDocumentRejectAPIView.as_view(), 
         name="admin-document-reject"),
] + router.urls
