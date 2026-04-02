from django.db import models

from users.models import User


# Create your models here.
class Studies(models.Model):
    name = models.CharField(max_length=100)
    terms_count = models.PositiveIntegerField()
    description = models.TextField()

class StudiesEdition(models.Model):
    class StatusChoices(models.TextChoices):
        HIDDEN = 'HIDDEN'
        ACTIVE = 'ACTIVE'
        CLOSED = 'CLOSED' # todo

    studies = models.ForeignKey(Studies, on_delete=models.RESTRICT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    max_participants = models.IntegerField()
    status = models.CharField(max_length=50, choices=StatusChoices.choices, default=StatusChoices.HIDDEN)
    syllabus_url = models.URLField()
    recruitment_start_date = models.DateTimeField()
    recruitment_end_date = models.DateTimeField()

STUDIES_EDITION_PUBLIC_VISIBLE_STATUSES = [
    StudiesEdition.StatusChoices.ACTIVE,
    StudiesEdition.StatusChoices.CLOSED,
]

STUDIES_EDITION_ENROLLABLE_STATUSES = [
    StudiesEdition.StatusChoices.ACTIVE,
]

class StudiesDocument(models.Model):
    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT)
    name = models.CharField(max_length=100)
    required = models.BooleanField()
    due_date = models.DateTimeField()

class StudiesEditionStaff(models.Model):
    class Meta:
        indexes = [
            models.Index(fields=["user", "studies_edition"]),
            models.Index(fields=["studies_edition", "role"]),
        ]

    class Roles(models.TextChoices):
        STUDIES_DIRECTOR = 'STUDIES_DIRECTOR'
        ADMINISTRATIVE_COORDINATOR = 'ADMINISTRATIVE_COORDINATOR'
        FINANCE_COORDINATOR = 'FINANCE_COORDINATOR'

    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT, related_name='studies_edition_staff')
    user = models.ForeignKey(User, on_delete=models.RESTRICT, related_name='studies_edition_staff')
    role = models.CharField(max_length=50, choices=Roles.choices)