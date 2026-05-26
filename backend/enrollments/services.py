import datetime
import logging
import os
from pathlib import Path
from uuid import uuid4

from django.core.files import File as DjangoFile
from django.db import IntegrityError, transaction
from django.http import Http404
from django.shortcuts import get_object_or_404
from docxtpl import DocxTemplate

from core import settings
from enrollments.exceptions import UserAlreadyEnrolledException, MissingDocumentsException, \
    UserNotRecruitingException
from enrollments.models import Enrollment, FormData, SubmittedDocument
from files.models import File
from notifications.exceptions import NotificationSendFailedException
from notifications.services import send_notif_to
from studies.models import StudiesEdition, StudiesDocument
from studies.services import get_enrollable_editions_queryset, DELIVERY_DOCUMENT_NAME

logger = logging.getLogger(__name__)

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
            save_form(serializer, enrollment)
    except IntegrityError as e:
        print(e)
        raise UserAlreadyEnrolledException()

    if is_enrolling_form(serializer):
        enroll(edition_id, enrollment.id)

def update_enrollment_form(edition_id, user, serializer):
    with transaction.atomic():
        enrollment = (Enrollment.objects
                        .select_for_update()
                        .get(user=user, studies_edition_id=edition_id))
        save_form(serializer, enrollment)

    if is_enrolling_form(serializer):
        enroll(edition_id, enrollment.id)

def save_form(serializer, enrollment):
    serializer.is_valid(raise_exception=True)

    files_ids = serializer.validated_data.pop("files_ids", [])
    files_uploads = serializer.validated_data.pop("files_uploads", [])

    serializer.save(enrollment=enrollment)

    create_form_files(enrollment.id, files_ids, files_uploads)

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
            status__in=Enrollment.Status.taking_up_place()
        ).count()

        if total >= edition.max_participants:
            status = Enrollment.Status.RESERVE
        else:
            status = Enrollment.Status.CANDIDATE

        enrollment.status = status
        enrollment.enrollment_date = datetime.datetime.now()
        enrollment.save()
        create_form_delivery_file(enrollment)

def create_form_files(enrollment_id, files_ids, files_uploads):
    for studies_document_id, uploaded_file in zip(files_ids, files_uploads):
        _create_submitted_document(enrollment_id, studies_document_id, uploaded_file)

def submit_document(enrollment_id, user, serializer):
    with transaction.atomic():
        get_object_or_404(
            Enrollment,
            pk=enrollment_id,
            user=user
        )

        file_data = serializer.validated_data.pop("file")
        _create_submitted_document(enrollment_id, file_data["studies_document_id"], file_data["file"])

def _create_submitted_document(enrollment_id, studies_document_id, uploaded_file):
    file_model_obj = File.objects.create(
        file=uploaded_file,
        source=File.Source.SUBMITTED
    )

    SubmittedDocument.objects.create(
        studies_document_id=studies_document_id,
        enrollment_id=enrollment_id,
        file=file_model_obj
    )

def create_form_delivery_file(enrollment):
    try:
        studies_document = StudiesDocument.objects.get(
            studies_edition=enrollment.studies_edition,
            name=DELIVERY_DOCUMENT_NAME,
            is_read_only=True
        )
    except StudiesDocument.DoesNotExist:
        return

    file_path = generate_form_docx(enrollment.form)
    with open(file_path, "rb") as f:
        django_file = DjangoFile(f, name=os.path.basename(file_path))

        file_model_obj = File.objects.create(
            file=django_file,
            source=File.Source.SUBMITTED
        )

        SubmittedDocument.objects.create(
            studies_document=studies_document,
            enrollment=enrollment,
            file=file_model_obj,
            status=SubmittedDocument.Status.DELIVERY
        )

    os.remove(file_path)


def generate_form_docx(form: FormData):
    template_path = Path(settings.BASE_DIR) / "enrollments" / "templates" / "formularz.docx"
    doc = DocxTemplate(template_path)

    edition = form.enrollment.studies_edition
    studies = edition.studies

    context = {
        "academic_year": edition.academic_year,
        "studies_name": studies.name,
        "organizational_unit": studies.organizational_unit,

        "first_name": form.first_name,
        "second_name": form.second_name or "",
        "last_name": form.last_name,
        "academic_title": form.academic_title,
        "family_name": form.family_name,
        "birth_date": form.birth_date,
        "birth_place": form.birth_place,
        "pesel": form.pesel,
        "citizenship": form.citizenship,
        "residential_address": form.residential_address,
        "registered_address": form.registered_address,
        "email": form.email,
        "phone": form.phone,
        "education": " ".join([form.education_university, form.education_location, form.education_year]),
        "maturity_country": form.maturity_country,
        "emergency_contact": " ".join([form.emergency_name, form.emergency_last_name, form.emergency_phone])
                             or "Nie podano",
    }

    doc.render(context)

    file_dir = Path(settings.MEDIA_ROOT) / "generated"
    os.makedirs(file_dir, exist_ok=True)
    filename = f"{studies.name}_{form.enrollment_id}_{uuid4().hex}.docx"
    file_path = file_dir / filename
    doc.save(file_path)

    return file_path


def check_and_promote_candidate_to_student(enrollment):
    if enrollment.status != Enrollment.Status.CANDIDATE:
        return

    _check_and_promote_to_student(enrollment)

def _check_student_promotion_available(enrollment):
    if enrollment.fees.filter(paid_date__isnull=True).exists():
        return False

    required_docs = StudiesDocument.objects.filter(
        studies_edition=enrollment.studies_edition,
        required=True
    )
    unconfirmed = required_docs.exclude(
        submitted_documents__enrollment=enrollment,
        submitted_documents__status__in=SubmittedDocument.Status.confirmed()
    )
    if unconfirmed.exists():
        return False

    return True

def _check_and_promote_to_student(enrollment):
    if not _check_student_promotion_available(enrollment):
        return

    enrollment.status = Enrollment.Status.STUDENT
    enrollment.save(update_fields=['status'])

def resign(enrollment: Enrollment):
    with transaction.atomic():
        current_status = enrollment.status
        if current_status not in Enrollment.Status.active():
            raise UserNotRecruitingException()

        studies_edition = enrollment.studies_edition
        is_recruitment_closed = studies_edition.status == StudiesEdition.Status.CLOSED

        status = Enrollment.Status.EXPELLED if is_recruitment_closed else Enrollment.Status.REJECTED
        enrollment.status = status
        enrollment.save(update_fields=['status'])

        if is_recruitment_closed:
            return

        if current_status in Enrollment.Status.taking_up_place():
            _promote_single_reservist(studies_edition)

def _promote_single_reservist(studies_edition):
    enrollment = (Enrollment.objects
                  .filter(studies_edition=studies_edition, status=Enrollment.Status.RESERVE)
                  .order_by('enrollment_date')
                  .first())

    if enrollment is None:
        return

    if _check_student_promotion_available(enrollment):
        status = Enrollment.Status.STUDENT
    else:
        status = Enrollment.Status.CANDIDATE

    change_enrollment_status(enrollment, status)

def promote_reservists_to_students(studies_edition, count):
    if count <= 0:
        return

    enrollments = (Enrollment.objects
                   .filter(studies_edition=studies_edition, status=Enrollment.Status.RESERVE)
                   .order_by('enrollment_date'))

    for enrollment in enrollments:
        if _check_student_promotion_available(enrollment):
            change_enrollment_status(enrollment, Enrollment.Status.STUDENT)

            count -= 1
            if count == 0:
                return

def change_enrollment_status(enrollment, new_status):
    enrollment.status = new_status
    enrollment.save(update_fields=['status'])

    def send_notification():
        studies = enrollment.studies_edition.studies
        user = enrollment.user
        subject = "Aktualizacja statusu rekrutacji"
        body = (
            f"Twój status zgłoszenia na kierunek\n"
            f"{studies.name}\n"
            f"Zmienił się na {new_status}"
        )
        try:
            send_notif_to(user, subject, body)
        except NotificationSendFailedException:
            logger.warning(
                f"Failed to send promotion notification for {user} - {subject}"
            )

    transaction.on_commit(send_notification)

def get_previous_form(user):
    enrollment = Enrollment.objects.filter(
        user=user,
        status__in=Enrollment.Status.strict_active()
    ).order_by("enrollment_date").first()

    if not enrollment:
        raise Http404("Enrollment not found")

    return enrollment.form