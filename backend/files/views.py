from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from files.models import File
from users.permissions import CanViewDocument


class FileDownloadApiView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated, CanViewDocument]
    queryset = File.objects.all()
    lookup_url_kwarg = "file_pk"

    def retrieve(self, request, *args, **kwargs):
        file_obj = self.get_object()

        return FileResponse(
            file_obj.file.open("rb"),
            as_attachment=False,
            filename=file_obj.file.name.split("/")[-1],
        )
