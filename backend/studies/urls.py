from django.urls import path
from . import views


urlpatterns = [
    path("", views.StudiesListCreateAPIView.as_view(), name="studies_listcreate"),
    path("<int:studies_pk>/", views.StudiesRetrieveUpdateDestroyAPIView.as_view(), name="studies_retreiveupdatedestroy"),
    path("editions/", views.StudiesEditionListCreateAPIView.as_view(), name="studies_editionlistcreate"),
    path("editions/<int:edition_pk>/", views.StudiesEditionRetrieveUpdateDestroyAPIView.as_view(), name="studies_editionretrieveupdatedestroy"),
    path("editions/<int:edition_pk>/staff", views.StudiesEditionStaffListCreateAPIView.as_view(), name="studies_editionstafflistcreate"),
    path("editions/<int:edition_pk>/staff/<int:user_pk>", views.StudiesEditionStaffDestroyAPIView.as_view(), name="studies_editionstafdestroy"),
]