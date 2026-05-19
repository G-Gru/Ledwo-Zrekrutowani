from django.urls import path

from .views import StudiesListCreateAdminAPIView, StudiesRetrieveUpdateDestroyAdminAPIView, \
    StudiesEditionListCreateAdminAPIView, \
    StudiesEditionRetrieveUpdateDestroyAdminAPIView, StudiesEditionStaffListCreateAdminAPIView, \
    StudiesEditionStaffDestroyAdminAPIView, StudiesDocumentsListCreateAdminAPIView, StudiesDocumentsDestroyAdminAPIView

urlpatterns = [
    path("",
         StudiesListCreateAdminAPIView.as_view(),
         name="admin-studies-list-create"),
    path("<int:studies_pk>/",
         StudiesRetrieveUpdateDestroyAdminAPIView.as_view(),
         name="admin-studies-retrieve-update"),
    path("editions/",
         StudiesEditionListCreateAdminAPIView.as_view(),
         name="admin-studies-editions-list-create"),
    path("editions/<int:edition_pk>/",
         StudiesEditionRetrieveUpdateDestroyAdminAPIView.as_view(),
         name="admin-studies-editions-retrieve-update-destroy"),
    path("editions/<int:edition_pk>/staff/",
         StudiesEditionStaffListCreateAdminAPIView.as_view(),
         name="admin-studies-editions-staff-list-create"),
    path("editions/<int:edition_pk>/staff/<int:staff_pk>/",
         StudiesEditionStaffDestroyAdminAPIView.as_view(),
         name="admin-studies-editions-staff-destroy"),
    path("editions/<int:edition_pk>/documents/",
         StudiesDocumentsListCreateAdminAPIView.as_view(),
         name="admin-studies-editions-documents-list-create"),
    path("editions/<int:edition_pk>/documents/<int:document_pk>/",
         StudiesDocumentsDestroyAdminAPIView.as_view(),
         name="admin-studies-editions-documents-destroy"),
]