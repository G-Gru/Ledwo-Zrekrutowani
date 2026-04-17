from django.db import models

from studies.models import StudiesEdition, StudiesDocument, StudiesEditionStaff
from users.models import User


class Enrollment(models.Model):
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'studies_edition'),
                name='unique user enrollment per studies edition'
            )
        ]

    class Status(models.TextChoices):
        DRAFT = 'DRAFT'
        CANDIDATE = 'CANDIDATE'
        STUDENT = 'STUDENT'
        EXPELLED = 'EXPELLED'

    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT)
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.DRAFT)
    status_note = models.CharField(max_length=200, blank=True)
    enrollment_date = models.DateTimeField(blank=True, null=True)

    def has_all_documents(self):
        required_documents = StudiesDocument.objects.filter(
            studies_edition=self.studies_edition,
            required=True,
            is_read_only=False
        )

        missing = required_documents.exclude(
            submitted_documents__enrollment=self,
            submitted_documents__status__in=SUBMITTED_DOCUMENT_ACCEPT_ENROLLMENT_STATUSES
        )

        return not missing.exists()

ENROLLMENT_TAKING_UP_PLACE_STATUSES = [
    Enrollment.Status.CANDIDATE,
    Enrollment.Status.STUDENT,
]

class SubmittedDocument(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'SUBMITTED'
        ACCEPTED = 'ACCEPTED'
        VERIFIED = 'VERIFIED'
        REJECTED = 'REJECTED'
        DELIVERY = 'SIGN & DELIVER'

    studies_document = models.ForeignKey(StudiesDocument, on_delete=models.RESTRICT, related_name='submitted_documents')
    enrollment = models.ForeignKey(Enrollment, on_delete=models.RESTRICT)
    file = models.FileField(upload_to='submitted_documents/')
    status = models.CharField(max_length=50, choices=Status.choices, default=Status.SUBMITTED)
    submitted_date = models.DateTimeField(auto_now_add=True)

SUBMITTED_DOCUMENT_ACCEPT_ENROLLMENT_STATUSES = [
    SubmittedDocument.Status.SUBMITTED,
    SubmittedDocument.Status.ACCEPTED,
    SubmittedDocument.Status.VERIFIED,
]

class DocumentHistory(models.Model):
    staff = models.ForeignKey(StudiesEditionStaff, on_delete=models.RESTRICT)
    submitted_document = models.ForeignKey(SubmittedDocument, on_delete=models.RESTRICT)
    modified_date = models.DateTimeField(auto_now_add=True)
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    note = models.CharField(max_length=200, blank=True)

class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    street = models.CharField(max_length=100)
    house_number = models.CharField(max_length=20)
    flat_number = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10, blank=True)

    def __str__(self):
        return (f"{self.street} {self.house_number}{'/' + self.flat_number if self.flat_number else ''}, "
                f"{self.postal_code if self.postal_code else ''} {self.city}")

class FormData(models.Model):
    REQUIRED_FIELDS = [
            "first_name",
            "last_name",
            "family_name",
            "academic_title",
            "birth_date",
            "birth_place",
            "pesel",
            "citizenship",
            "residential_address",
            "registered_address",
            "email",
            "phone",
            "education",
            "education_country",
    ]

    class Action(models.TextChoices):
        SAVE = 'SAVE'
        ENROLL = 'ENROLL'

    enrollment = models.OneToOneField(Enrollment, on_delete=models.RESTRICT, primary_key=True, related_name="form")
    first_name = models.CharField(max_length=50, blank=True)
    second_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50, blank=True)
    family_name = models.CharField(max_length=50, blank=True)
    academic_title = models.CharField(max_length=50, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    birth_place = models.CharField(max_length=50, blank=True)
    pesel = models.CharField(max_length=11, blank=True)
    citizenship = models.CharField(max_length=50, blank=True)
    residential_address = models.ForeignKey(Address, on_delete=models.RESTRICT, related_name="residential_formdata")
    registered_address = models.ForeignKey(Address, on_delete=models.RESTRICT, related_name="registered_formdata")
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    education = models.CharField(max_length=50, blank=True)
    education_country = models.CharField(max_length=50, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    modified_date = models.DateTimeField(auto_now=True)
