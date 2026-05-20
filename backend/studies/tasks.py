from celery import shared_task

@shared_task
def open_recruitment_task(studies_edition_id: int):
    from studies.services import open_recruitment

    open_recruitment(studies_edition_id)


@shared_task
def close_recruitment_task(studies_edition_id: int):
    from studies.services import close_recruitment

    close_recruitment(studies_edition_id)