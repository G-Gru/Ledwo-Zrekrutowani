from django.urls import path
from . import views


urlpatterns = [
    path("", views.StudiesListCreateAPIView.as_view(), name="studies_listcreate"),
    path("<int:pk>/", views.StudiesRetrieveUpdateDestroyAPIView.as_view(), name="studies_retreiveupdatedestroy"),
    path("editions/", views.StudiesEditionListCreateAPIView.as_view(), name="studies_editionlistcreate"),
    path("editions/<int:pk>/", views.StudiesEditionRetrieveUpdateDestroyAPIView.as_view(), name="studies_editionretrieveupdatedestroy"),
]