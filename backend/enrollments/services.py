import datetime

from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from enrollments.exceptions import UserAlreadyEnrolledException, NoPlacesAvailableException, MissingDocumentsException
from enrollments.models import Enrollment, FormData, ENROLLMENT_TAKING_UP_PLACE_STATUSES, SubmittedDocument
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
            create_form_files(enrollment.id, serializer)
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

        create_form_files(enrollment.id, serializer)
        serializer.save(enrollment=enrollment)

    if is_enrolling_form(serializer):
        enroll(edition_id, enrollment.id)

def enroll(edition_id, enrollment_id):
    with transaction.atomic():
        enrollment = (Enrollment.objects
                      .select_for_update()
                      .get(pk=enrollment_id))

        if not enrollment.has_all_documents():
            raise MissingDocumentsException()

        edition = (StudiesEdition.objects
                   .select_for_update()
                   .get(pk=edition_id))

        total = Enrollment.objects.filter(
            studies_edition=edition,
            status__in=ENROLLMENT_TAKING_UP_PLACE_STATUSES
        ).count()

        if total >= edition.max_participants:
            raise NoPlacesAvailableException()


        enrollment.status = Enrollment.Status.CANDIDATE
        enrollment.enrollment_date = datetime.datetime.now()
        enrollment.save()

def create_form_files(enrollment_id, serializer):
    files_data = serializer.validated_data.pop("files", [])
    for file_data in files_data:
        studies_document_id = file_data["studies_document_id"]
        file = file_data["file"]

        SubmittedDocument.objects.create(
            studies_document_id=studies_document_id,
            enrollment_id=enrollment_id,
            file=file
        )