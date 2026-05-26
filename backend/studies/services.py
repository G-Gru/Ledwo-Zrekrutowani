from celery.result import AsyncResult
from django.db import transaction
from rest_framework.generics import get_object_or_404

from enrollments.models import Enrollment
from studies import tasks
from studies.models import StudiesEdition, \
    StudiesDocument


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
        status__in=StudiesEdition.Status.public_visible()
    )

def get_enrollable_editions_queryset():
    return StudiesEdition.objects.filter(
        status__in=StudiesEdition.Status.enrollable()
    )

def add_to_edition(edition_id, user, serializer):
    with transaction.atomic():
        edition = get_object_or_404(
            get_user_editions_queryset(user),
            pk=edition_id
        )

        serializer.save(studies_edition=edition)

DELIVERY_DOCUMENT_NAME = "Dostarczenie wydruku formularza"
def _create_auto_documents(edition):
    StudiesDocument.objects.create(
        studies_edition=edition,
        name=DELIVERY_DOCUMENT_NAME,
        required=True,
        due_date=edition.recruitment_end_date,
        is_read_only=True
    )

def _schedule_edition_tasks(edition):
    if edition.task_open_id:
        AsyncResult(edition.task_open_id).revoke()

    if edition.task_close_id:
        AsyncResult(edition.task_close_id).revoke()

    open_result = tasks.open_recruitment_task.apply_async(
        args=[edition.id],
        eta=edition.recruitment_start_date,
    )

    close_result = tasks.close_recruitment_task.apply_async(
        args=[edition.id],
        eta=edition.recruitment_end_date,
    )

    edition.task_open_id = open_result.id
    edition.task_close_id = close_result.id
    edition.save(update_fields=[
        "task_open_id",
        "task_close_id",
    ])

def on_create_edition(edition: StudiesEdition):
    _create_auto_documents(edition)
    _schedule_edition_tasks(edition)

def on_update_edition(edition: StudiesEdition):
    _schedule_edition_tasks(edition)

def on_delete_edition(edition: StudiesEdition):
    if edition.task_open_id:
        AsyncResult(edition.task_open_id).revoke()

    if edition.task_close_id:
        AsyncResult(edition.task_close_id).revoke()

@transaction.atomic
def open_recruitment(studies_edition_id):
    edition = StudiesEdition.objects.select_for_update().get(
        pk=studies_edition_id
    )

    if edition.status != StudiesEdition.Status.HIDDEN:
        return

    edition.status = StudiesEdition.Status.ACTIVE
    edition.save(update_fields=["status"])

@transaction.atomic
def close_recruitment(studies_edition_id):
    from enrollments.services import promote_reservists_to_students, change_enrollment_status

    edition = StudiesEdition.objects.select_for_update().get(
        pk=studies_edition_id
    )

    if edition.status != StudiesEdition.Status.ACTIVE:
        return

    edition.status = StudiesEdition.Status.CLOSED
    edition.save(update_fields=["status"])

    # All candidates left are to be rejected and replaced
    candidates_left = Enrollment.objects.filter(
        studies_edition=edition,
        status=Enrollment.Status.CANDIDATE
    ).count()

    promote_reservists_to_students(edition, candidates_left)

    remaining_list = Enrollment.objects.filter(
        studies_edition=edition,
        status__in=[
            Enrollment.Status.DRAFT,
            Enrollment.Status.CANDIDATE,
            Enrollment.Status.RESERVE
        ]
    ).select_related("user", "studies_edition__studies")

    for enrollment in remaining_list:
        change_enrollment_status(enrollment, Enrollment.Status.REJECTED)


@transaction.atomic
def cancel_edition(edition_id):
    from notifications.services import send_notif_to
    from notifications.exceptions import NotificationSendFailedException
    import logging
    logger = logging.getLogger(__name__)

    edition = (StudiesEdition.objects
               .select_for_update()
               .select_related("studies")
               .get(pk=edition_id))

    if edition.status != StudiesEdition.Status.ACTIVE:
        raise ValueError("Można anulować tylko aktywne edycje.")

    edition_name = f"{edition.studies.name} ({edition.academic_year})"

    candidates = (Enrollment.objects
                  .filter(studies_edition=edition, status=Enrollment.Status.CANDIDATE)
                  .select_related("user")
                  .prefetch_related("fees"))

    for enrollment in candidates:
        has_paid = enrollment.fees.filter(paid_date__isnull=False).exists()

        if has_paid:
            body = (
                f"Informujemy, że edycja studiów podyplomowych \"{edition_name}\" "
                f"została odwołana z powodu niewystarczającej liczby zgłoszeń.\n\n"
                f"Ze względu na dokonaną przez Państwa wpłatę, nasz zespół skontaktuje się "
                f"z Państwem w celu ustalenia szczegółów zwrotu środków.\n\n"
                f"Przepraszamy za utrudnienia i liczymy na Państwa wyrozumiałość."
            )
        else:
            body = (
                f"Informujemy, że edycja studiów podyplomowych \"{edition_name}\" "
                f"została odwołana z powodu niewystarczającej liczby zgłoszeń.\n\n"
                f"Przepraszamy za utrudnienia i liczymy na Państwa wyrozumiałość."
            )

        try:
            send_notif_to(
                enrollment.user,
                subject=f"Odwołanie edycji studiów: {edition_name}",
                body=body,
            )
        except NotificationSendFailedException:
            logger.warning(f"Failed to send cancellation email to {enrollment.user.email}")

        enrollment.status = Enrollment.Status.CANCELLED
        enrollment.save(update_fields=["status"])

    edition.status = StudiesEdition.Status.CANCELLED
    edition.save(update_fields=["status"])
