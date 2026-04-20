from django.urls import path

from files.views import FileDownloadApiView

urlpatterns = [
    path("<int:file_pk>/",
         FileDownloadApiView.as_view(),
         name="file-download"),
]