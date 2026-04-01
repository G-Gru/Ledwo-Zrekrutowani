from rest_framework import generics
from rest_framework.permissions import IsAdminUser, AllowAny

from studies.models import StudiesEdition, Studies, StudiesEditionStaff
from studies.serializers import StudiesSerializer, StudiesEditionDetailsSerializer, StudiesEditionCreateSerializer, \
    StudiesEditionListSerializer, StudiesEditionStaffSerializer
from users.permissions import IsStudiesDirector, IsAdministrativeCoordinator, IsDirectorOrAdministrativeCoordinator


class StudiesListCreateAPIView(generics.ListCreateAPIView):
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser()]

class StudiesRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    lookup_url_kwarg = "studies_pk"
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser()]


class StudiesEditionListCreateAPIView(generics.ListCreateAPIView):
    queryset = StudiesEdition.objects.select_related('studies')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudiesEditionCreateSerializer
        return StudiesEditionListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdminUser()]
        return [AllowAny()]


class StudiesEditionRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateAPIView):
    lookup_url_kwarg = "edition_pk"
    queryset = StudiesEdition.objects.select_related('studies')
    serializer_class = StudiesEditionDetailsSerializer

    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsDirectorOrAdministrativeCoordinator()]


class StudiesEditionStaffListCreateAPIView(generics.ListCreateAPIView):
    lookup_url_kwarg = "edition_pk"
    serializer_class = StudiesEditionStaffSerializer

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        return (StudiesEditionStaff.objects
                .filter(pk=pk)
                .select_related('user'))

    def perform_create(self, serializer):
        pk = self.kwargs['edition_pk']
        serializer.save(studies_edition=pk)

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsDirectorOrAdministrativeCoordinator()]
        return [AllowAny()]

class StudiesEditionStaffDestroyAPIView(generics.DestroyAPIView):
    lookup_url_kwarg = "user_pk"
    permission_classes = [IsDirectorOrAdministrativeCoordinator()]

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        return (StudiesEditionStaff.objects
                .filter(pk=pk))
