from django.db import models

from users.models import User


# Create your models here.
class Studies(models.Model):
    name = models.CharField(max_length=100)
    terms_count = models.IntegerField()
    description = models.TextField()


class StudiesEdition(models.Model):
    studies = models.ForeignKey(Studies, on_delete=models.RESTRICT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField()
    end_date = models.DateField()
    max_participants = models.IntegerField()
    status = models.CharField(max_length=50)
    syllabus_url = models.URLField()
    recruitment_start_date = models.DateTimeField()
    recruitment_end_date = models.DateTimeField()

class StudiesDocument(models.Model):
    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT)
    name = models.CharField(max_length=100)
    required = models.BooleanField()
    due_date = models.DateTimeField()

class StudiesEditionStaff(models.Model):
    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT)
    employee = models.ForeignKey(User, on_delete=models.RESTRICT) #TODO change to Employee!