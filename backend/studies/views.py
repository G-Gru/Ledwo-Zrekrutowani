from django.db import transaction
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser

from studies.models import StudiesEdition, Studies, StudiesEditionStaff, STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES
from studies.serializers import StudiesSerializer, StudiesEditionDetailsSerializer, StudiesEditionCreateSerializer, \
    StudiesEditionListSerializer, StudiesEditionStaffSerializer
from users.permissions import IsDirectorOrAdministrativeCoordinator, \
    IsDirectorOrCoordinator


## PUBLIC
class StudiesEditionListAPIView(generics.ListAPIView):
    queryset = (StudiesEdition.objects
                .filter(status__in=STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES)
                .select_related('studies'))
    serializer_class = StudiesEditionListSerializer


class StudiesEditionRetrieveAPIView(generics.RetrieveAPIView):
    lookup_url_kwarg = "edition_pk"
    queryset = (StudiesEdition.objects
                .filter(status__in=STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES)
                .select_related('studies'))
    serializer_class = StudiesEditionDetailsSerializer


class StudiesEditionStaffListAPIView(generics.ListAPIView):
    serializer_class = StudiesEditionStaffSerializer

    def get_queryset(self):
        edition_pk = self.kwargs.get("edition_pk")

        return (StudiesEditionStaff.objects
            .filter(
                studies_edition_id=edition_pk,
                studies_edition__status__in=STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES
            )
            .select_related('studies_edition', 'user'))

## ADMIN
class StudiesListCreateAdminAPIView(generics.ListCreateAPIView):
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser()]


class StudiesRetrieveUpdateDestroyAdminAPIView(generics.RetrieveUpdateDestroyAPIView):
    lookup_url_kwarg = "studies_pk"
    queryset = Studies.objects.all()
    serializer_class = StudiesSerializer
    permission_classes = [IsAdminUser()]


class StudiesEditionListCreateAdminAPIView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudiesEditionCreateSerializer
        return StudiesEditionListSerializer

    def get_queryset(self):
        return (StudiesEdition.objects
                    .filter(studies_edition_staff__user=self.request.user)
                    .distinct()
                    .select_related('studies'))

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsDirectorOrCoordinator()]
        return [IsAdminUser()]


class StudiesEditionRetrieveUpdateDestroyAdminAPIView(generics.RetrieveUpdateAPIView):
    lookup_url_kwarg = "edition_pk"
    serializer_class = StudiesEditionDetailsSerializer
    permission_classes = [IsDirectorOrAdministrativeCoordinator()]

    def get_queryset(self):
        return (StudiesEdition.objects
                    .filter(studies_edition_staff__user=self.request.user)
                    .distinct()
                    .select_related('studies'))


class StudiesEditionStaffListCreateAdminAPIView(generics.ListCreateAPIView):
    lookup_url_kwarg = "edition_pk"
    serializer_class = StudiesEditionStaffSerializer
    permission_classes = [IsDirectorOrAdministrativeCoordinator()]

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        return (StudiesEditionStaff.objects
                .filter(studies_edition__studies_edition_staff__user=self.request.user)
                .filter(studies_edition_id=pk)
                .distinct()
                .select_related('user'))

    def perform_create(self, serializer):
        with transaction.atomic():
            pk = self.kwargs['edition_pk']
            edition = StudiesEdition.objects.filter(
                id=pk,
                studies_edition_staff__user=self.request.user
            ).first()

            if not edition:
                raise PermissionDenied()

            serializer.save(studies_edition=edition)


class StudiesEditionStaffDestroyAdminAPIView(generics.DestroyAPIView):
    lookup_url_kwarg = "user_pk"
    permission_classes = [IsDirectorOrAdministrativeCoordinator()]

    def get_queryset(self):
        pk = self.kwargs['edition_pk']
        return (StudiesEditionStaff.objects
                .filter(studies_edition__studies_edition_staff__user=self.request.user)
                .filter(studies_edition_id=pk)
                .distinct())
