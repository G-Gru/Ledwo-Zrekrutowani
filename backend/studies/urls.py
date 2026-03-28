from django.urls import path
from . import views

urlpatterns = [
    path("", views.studies_editions, name="studies_editions"),
]