import datetime

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from enrollments.exceptions import UserAlreadyEnrolledException, NoPlacesAvailableException
from enrollments.models import Enrollment, FormData, ENROLLMENT_TAKING_UP_PLACE_STATUSES
from studies.models import StudiesEdition
from studies.services import get_enrollable_editions_queryset


def get_enrollable_edition(edition_pk):
    return get_object_or_404(
        (get_enrollable_editions_queryset()
         .filter(pk=edition_pk))
    )

def is_enrolling_form(form_serializer):
    action = form_serializer.validated_data.get("action")
    return action == FormData.Action.ENROLL

def create_enrollment_form(edition_id, user, serializer):
    try:
        with transaction.atomic():
            enrollment = Enrollment.objects.create(user=user,
                                                   studies_edition_id=edition_id,
                                                   status=Enrollment.Status.DRAFT)
            serializer.save(enrollment=enrollment)
    except IntegrityError:
        raise UserAlreadyEnrolledException()

    if is_enrolling_form(serializer):
        enroll(edition_id, enrollment.id)

def update_enrollment_form(edition_id, user, serializer):
    with transaction.atomic():
        enrollment = (Enrollment.objects
                        .select_for_update()
                        .get(user=user, studies_edition_id=edition_id))
        serializer.save(enrollment=enrollment)

    if is_enrolling_form(serializer):
        enroll(edition_id, enrollment.id)

def enroll(edition_id, enrollment_id):
    with transaction.atomic():
        edition = (StudiesEdition.objects
                   .select_for_update()
                   .get(pk=edition_id))

        total = Enrollment.objects.filter(
            studies_edition=edition,
            status__in=ENROLLMENT_TAKING_UP_PLACE_STATUSES
        ).count()

        if total >= edition.max_participants:
            raise NoPlacesAvailableException()

        enrollment = (Enrollment.objects
                      .select_for_update()
                      .get(pk=enrollment_id))

        enrollment.status = Enrollment.Status.CANDIDATE
        enrollment.enrollment_date = datetime.datetime.now()
        enrollment.save()