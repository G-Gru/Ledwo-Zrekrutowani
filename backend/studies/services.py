from celery.result import AsyncResult
from django.db import transaction
from rest_framework.generics import get_object_or_404

from studies import tasks
from studies.models import StudiesEdition, STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES, STUDIES_EDITION_ENROLLABLE_STATUSES, \
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

    if edition.status != StudiesEdition.StatusChoices.HIDDEN:
        return

    edition.status = StudiesEdition.StatusChoices.ACTIVE
    edition.save(update_fields=["status"])

@transaction.atomic
def close_recruitment(studies_edition_id):
    edition = StudiesEdition.objects.select_for_update().get(
        pk=studies_edition_id
    )

    if edition.status != StudiesEdition.StatusChoices.ACTIVE:
        return

    edition.status = StudiesEdition.StatusChoices.CLOSED
    edition.save(update_fields=["status"])