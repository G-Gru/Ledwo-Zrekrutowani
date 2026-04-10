from django.db import models

from enrollments.models import Enrollment


class Fees(models.Model):
    enrollment = models.ForeignKey(Enrollment, on_delete=models.RESTRICT, related_name='fees')
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