from django.urls import path
from .views import StudiesEditionListAPIView, StudiesEditionRetrieveAPIView, StudiesEditionStaffListAPIView

urlpatterns = [
    path("editions",
         StudiesEditionListAPIView.as_view(),
         name="studies_list"),
    path("editions/<int:studies_pk>",
         StudiesEditionRetrieveAPIView.as_view(),
         name="studies_retrieve"),
    path("editions/<int:edition_pk>/staff",
         StudiesEditionStaffListAPIView.as_view(),
         name="studies_staff_list"),
]