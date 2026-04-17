import datetime
import os
from pathlib import Path
from uuid import uuid4

from django.core.files import File
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404

from core import settings
from enrollments.exceptions import UserAlreadyEnrolledException, NoPlacesAvailableException, MissingDocumentsException
from enrollments.models import Enrollment, FormData, ENROLLMENT_TAKING_UP_PLACE_STATUSES, SubmittedDocument
from studies.models import StudiesEdition, StudiesDocument
from studies.services import get_enrollable_editions_queryset, DELIVERY_DOCUMENT_NAME

from docxtpl import DocxTemplate

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
    except IntegrityError:
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
    serializer.save(enrollment=enrollment)
    create_form_files(enrollment.id, serializer)

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
        create_form_delivery_file(enrollment)

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
        django_file = File(f, name=os.path.basename(file_path))

        SubmittedDocument.objects.create(
            studies_document=studies_document,
            enrollment=enrollment,
            file=django_file,
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
        "education": form.education,
        "education_country": form.education_country,
        "emergency_contact": form.emergency_contact or "Nie podano",
    }

    doc.render(context)

    file_dir = Path(settings.MEDIA_ROOT) / "generated"
    os.makedirs(file_dir, exist_ok=True)
    filename = f"{studies.name}_{form.enrollment_id}_{uuid4().hex}.docx"
    file_path = file_dir / filename
    doc.save(file_path)

    return file_path