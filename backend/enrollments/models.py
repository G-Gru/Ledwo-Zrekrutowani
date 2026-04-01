from django.db import models

from studies.models import StudiesEdition, StudiesDocument, StudiesEditionStaff
from users.models import User


class Enrollment(models.Model):
    user = models.ForeignKey(User, on_delete=models.RESTRICT)
    studies_edition = models.ForeignKey(StudiesEdition, on_delete=models.RESTRICT)
    status = models.CharField(max_length=50)
    status_note = models.CharField(max_length=200, blank=True)
    enrollment_date = models.DateTimeField()

class SubmittedDocument(models.Model):
    studies_document = models.ForeignKey(StudiesDocument, on_delete=models.RESTRICT)
    enrollment = models.ForeignKey(Enrollment, on_delete=models.RESTRICT)
    file = models.FileField(upload_to='submitted_documents/')
    status = models.CharField(max_length=50)
    submitted_date = models.DateTimeField(auto_now_add=True)

class DocumentHistory(models.Model):
    staff = models.ForeignKey(StudiesEditionStaff, on_delete=models.RESTRICT)
    submitted_document = models.ForeignKey(SubmittedDocument, on_delete=models.RESTRICT)
    modified_date = models.DateTimeField(auto_now_add=True)
    previous_status = models.CharField(max_length=50)
    new_status = models.CharField(max_length=50)
    note = models.CharField(max_length=200, blank=True)

class Address(models.Model):
    street = models.CharField(max_length=100)
    house_number = models.CharField(max_length=20)
    flat_number = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=50)
    country = models.CharField(max_length=50)
    postal_code = models.CharField(max_length=10, blank=True)

class FormData(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.RESTRICT)
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
    education = models.CharField(max_length=50, blank=True)
    education_country = models.CharField(max_length=50, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    modified_date = models.DateTimeField(auto_now=True)

class Fees(models.Model):
    enrollment = models.ForeignKey('Enrollment', on_delete=models.RESTRICT, related_name='fees')
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    issued_date = models.DateField(auto_now_add=True)
    paid_date = models.DateField(null=True, blank=True)

class Payments(models.Model):
    fee = models.ForeignKey(Fees, on_delete=models.RESTRICT, related_name='payments')
    payment_method = models.CharField(max_length=50)
    reference_number = models.IntegerField()
    status = models.CharField(max_length=50)

class PaymentsHistory(models.Model):
    payment = models.ForeignKey(Payments, on_delete=models.RESTRICT)
    modified_date = models.DateField(auto_now_add=True)
    previous_status = models.CharField(max_length=50, null=True, blank=True)
    new_status = models.CharField(max_length=50)
    note = models.CharField(max_length=255, null=True, blank=True)