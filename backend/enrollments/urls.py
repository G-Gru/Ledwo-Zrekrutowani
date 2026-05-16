from django.urls import path

from enrollments.views import EnrollmentFormCreateAPIView, EnrollmentFormRetrieveUpdateAPIView, \
    AddressListCreateAPIView, AddressRetreiveDestroyAPIView, EnrollmentListAPIView, EnrollmentRetrieveDestroyAPIView, \
    ActiveEnrollmentListAPIView, EnrollmentRecruitmentEndDateAPIView, \
    SubmittedDocumentsListCreateAPIView, FeeListAPIView

urlpatterns = [
    path("editions/<int:edition_pk>/",
         EnrollmentFormCreateAPIView.as_view(),
         name="enrollment-form-create"),
    path("editions/<int:edition_pk>/form/",
         EnrollmentFormRetrieveUpdateAPIView.as_view(),
         name="enrollment-form-retrieve-update"),
    path("addresses/",
         AddressListCreateAPIView.as_view(),
         name="address-list-create"),
    path("addresses/<int:address_pk>/",
         AddressRetreiveDestroyAPIView.as_view(),
         name="address-delete"),
    path("",
         EnrollmentListAPIView.as_view(),
         name="enrollment-list"),
    path("active/",
         ActiveEnrollmentListAPIView.as_view(),
         name="enrollment-active-list"),
    path("<int:enrollment_pk>/",
         EnrollmentRetrieveDestroyAPIView.as_view(),
         name="enrollment-retrieve"),
    path("<int:enrollment_pk>/documents/",
         SubmittedDocumentsListCreateAPIView.as_view(),
         name="submitted-documents-list"),
    path("<int:enrollment_pk>/recruitment-end-date/",
         EnrollmentRecruitmentEndDateAPIView.as_view(),
         name="enrollment-recruitment-end-date"),
    path("<int:enrollment_pk>/fees/",
         FeeListAPIView.as_view(),
         name="fees-list"),
]