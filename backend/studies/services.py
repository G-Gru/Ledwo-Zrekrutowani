from django.db import transaction
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404

from studies.models import StudiesEdition, STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES, STUDIES_EDITION_ENROLLABLE_STATUSES


def get_user_editions_queryset(user):
    qs = StudiesEdition.objects.all()

    if user.is_staff:
        return qs

    #Todo dean/other groups later

    return (
        qs
        .filter(studies_edition_staff__user=user)
        .distinct()
    )

def get_public_visible_editions_queryset():
    return StudiesEdition.objects.filter(
        status__in=STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES
    )

def get_enrollable_editions_queryset():
    return StudiesEdition.objects.filter(
        status__in=STUDIES_EDITION_ENROLLABLE_STATUSES
    )

def add_to_edition(edition_id, user, serializer):
    with transaction.atomic():
        edition = get_object_or_404(
            get_user_editions_queryset(user),
            pk=edition_id
        )

        serializer.save(studies_edition=edition)
