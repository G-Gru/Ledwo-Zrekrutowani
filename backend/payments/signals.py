from django.db.models.signals import post_save
from django.dispatch import receiver

from enrollments.models import Enrollment
from payments.models import Fee
from payments.services import create_fee_for_enrollment


@receiver(post_save, sender=Enrollment)
def create_fee_on_candidate(sender, instance, **kwargs):
    if instance.status != Enrollment.Status.CANDIDATE:
        return
    if Fee.objects.filter(enrollment=instance).exists():
        return
    create_fee_for_enrollment(instance, instance.studies_edition)