from django.urls import path
from enrollments.views import EnrollmentFormCreateAPIView, EnrollmentFormRetrieveUpdateAPIView, \
    AddressListCreateAPIView, AddressRetreiveDestroyAPIView

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
]
