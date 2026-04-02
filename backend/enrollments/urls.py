from django.urls import path, include

from enrollments.views import EnrollmentFormCreateAPIView, EnrollmentFormRetrieveUpdateAPIView

urlpatterns = [
    path("editions/<int:edition_pk>/",
         EnrollmentFormCreateAPIView.as_view(),
         name="enrollment-form-create"),
    path("editions/<int:edition_pk>/form/",
         EnrollmentFormRetrieveUpdateAPIView.as_view(),
         name="enrollment-form-retrieve-update"),
]
