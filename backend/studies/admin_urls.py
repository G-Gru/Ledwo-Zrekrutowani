from django.urls import path

from .views import StudiesListCreateAdminAPIView, StudiesRetrieveUpdateDestroyAdminAPIView, \
    StudiesEditionListCreateAdminAPIView, \
    StudiesEditionRetrieveUpdateDestroyAdminAPIView, StudiesEditionStaffListCreateAdminAPIView, \
    StudiesEditionStaffDestroyAdminAPIView

urlpatterns = [
    path("",
         StudiesListCreateAdminAPIView.as_view(),
         name="admin-studies-list-create"),
    path("<int:studies_pk>",
         StudiesRetrieveUpdateDestroyAdminAPIView.as_view(),
         name="admin-studies-retrieve-update"),
    path("editions",
         StudiesEditionListCreateAdminAPIView.as_view(),
         name="admin-studies-editions-list-create"),
    path("editions/<int:edition_pk>",
         StudiesEditionRetrieveUpdateDestroyAdminAPIView.as_view(),
         name="admin-studies-editions-retrieve-update-destroy"),
    path("editions/<int:edition_pk>/staff",
         StudiesEditionStaffListCreateAdminAPIView.as_view(),
         name="admin-studies-editions-staff-list-create"),
    path("editions/<int:edition_pk>/staff/<int:user_pk>",
         StudiesEditionStaffDestroyAdminAPIView.as_view(),
         name="admin-studies-editions-staff-destroy"),
]