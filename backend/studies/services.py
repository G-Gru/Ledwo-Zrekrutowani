from studies.models import StudiesEdition, STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES, STUDIES_EDITION_ENROLLABLE_STATUSES


def get_user_editions_queryset(request):
    qs = StudiesEdition.objects.all()

    if request.user.is_staff:
        return qs

    #Todo dean/other groups later

    return (
        qs
        .filter(studies_edition_staff__user=request.user)
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