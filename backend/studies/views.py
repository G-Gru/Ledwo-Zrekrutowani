from rest_framework import generics, permissions
from rest_framework.permissions import IsAdminUser

from studies import services
from studies.models import Studies, StudiesEditionStaff, StudiesDocument
from studies.serializers import StudiesSerializer, StudiesEditionDetailsSerializer, StudiesEditionCreateSerializer, \
    StudiesEditionListSerializer, StudiesEditionStaffWriteSerializer, \
    StudiesEditionStaffReadSerializer, StudiesDocumentSerializer
from users.permissions import IsDirectorOrAdministrativeCoordinator, \
    IsDirectorOrCoordinator


## PUBLIC
class StudiesEditionListAPIView(generics.ListAPIView):
    queryset = (services
                .get_public_visible_editions_queryset()
                .select_related('studies'))
    serializer_class = StudiesEditionListSerializer


class StudiesEditionRetrieveAPIView(generics.RetrieveAPIView):
    lookup_url_kwarg = "edition_pk"
    queryset = (services
                .get_public_visible_editions_queryset()
                .select_related('studies'))
    serializer_class = StudiesEditionDetailsSerializer


class StudiesEditionStaffListAPIView(generics.ListAPIView):
    serializer_class = StudiesEditionStaffReadSerializer

    def get_queryset(self):
        edition_pk = self.kwargs.get("edition_pk")
        public_editions = services.get_public_visible_editions_queryset()

        return (StudiesEditionStaff.objects
            .filter(
                studies_edition_id=edition_pk,
                studies_edition__in=public_editions
            )
            .select_related('studies_edition', 'user'))


class StudiesDocumentsListAPIView(generics.ListAPIView):
    serializer_class = StudiesDocumentSerializer

    def get_queryset(self):
        edition_pk = self.kwargs.get("edition_pk")
        public_editions = services.get_public_visible_editions_queryset()

        return (StudiesDocument.objects
            .filter(
                studies_edition_id=edition_pk,
                studies_edition__in=public_editions
            ))

## ADMIN
class StudiesListCreateAdminAPIView(generics.ListCreateAPIView):
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser]


class StudiesRetrieveUpdateDestroyAdminAPIView(generics.RetrieveUpdateDestroyAPIView):
    lookup_url_kwarg = "studies_pk"
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser]


class StudiesEditionListCreateAdminAPIView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudiesEditionCreateSerializer
        return StudiesEditionListSerializer

    def get_queryset(self):
        return (services.get_user_editions_queryset(self.request.user)
                    .select_related('studies'))

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsDirectorOrCoordinator()]
        return [IsAdminUser()]


class StudiesEditionRetrieveUpdateDestroyAdminAPIView(generics.RetrieveUpdateAPIView):
    lookup_url_kwarg = "edition_pk"
    serializer_class = StudiesEditionDetailsSerializer

    def get_queryset(self):
        return (services.get_user_editions_queryset(self.request.user)
                    .select_related('studies'))

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsDirectorOrCoordinator()]
        return [IsDirectorOrAdministrativeCoordinator()]


class StudiesEditionStaffListCreateAdminAPIView(generics.ListCreateAPIView):
    lookup_url_kwarg = "edition_pk"

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        user_editions = services.get_user_editions_queryset(self.request.user)
        return (StudiesEditionStaff.objects
                .filter(studies_edition_id=pk)
                .filter(studies_edition__in=user_editions)
                .select_related('user'))

    def perform_create(self, serializer):
        pk = self.kwargs['edition_pk']
        services.add_to_edition(pk, self.request.user, serializer)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsDirectorOrCoordinator()]
        return [IsDirectorOrAdministrativeCoordinator()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudiesEditionStaffWriteSerializer
        return StudiesEditionStaffReadSerializer


class StudiesEditionStaffDestroyAdminAPIView(generics.DestroyAPIView):
    lookup_url_kwarg = "staff_pk"
    permission_classes = [IsDirectorOrAdministrativeCoordinator]

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        user_editions = services.get_user_editions_queryset(self.request.user)
        return (StudiesEditionStaff.objects
                .filter(studies_edition_id=pk)
                .filter(studies_edition__in=user_editions))


class StudiesDocumentsListCreateAdminAPIView(generics.ListCreateAPIView):
    serializer_class = StudiesDocumentSerializer
    lookup_url_kwarg = "edition_pk"

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        user_editions = services.get_user_editions_queryset(self.request.user)
        return (StudiesDocument.objects
                .filter(studies_edition_id=pk)
                .filter(studies_edition__in=user_editions))

    def perform_create(self, serializer):
        pk = self.kwargs['edition_pk']
        services.add_to_edition(pk, self.request.user, serializer)

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsDirectorOrCoordinator()]
        return [IsDirectorOrAdministrativeCoordinator()]


class StudiesDocumentsDestroyAdminAPIView(generics.DestroyAPIView):
    lookup_url_kwarg = "documents_pk"
    permission_classes = [IsDirectorOrAdministrativeCoordinator]

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        user_editions = services.get_user_editions_queryset(self.request.user)
        return (StudiesDocument.objects
                .filter(studies_edition_id=pk)
                .filter(studies_edition__in=user_editions))