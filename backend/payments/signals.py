from django.db.models.signals import post_save
from django.dispatch import receiver

from enrollments.models import Enrollment, ENROLLMENT_RECRUITING_STATUSES
from payments.models import Fee
from payments.services import create_application_fee, create_tuition_fee


@receiver(post_save, sender=Enrollment)
def create_fee_on_candidate(sender, instance, **kwargs):
    if instance.status not in ENROLLMENT_RECRUITING_STATUSES:
        return
    if Fee.objects.filter(enrollment=instance, title=f"Opłata rekrutacyjna za {instance.studies_edition.studies.name}").exists():
        return
    create_application_fee(instance, instance.studies_edition)


@receiver(post_save, sender=Enrollment)
def create_studies_fee_on_student(sender, instance, **kwargs):
    if instance.status != Enrollment.Status.STUDENT:
        return
    if Fee.objects.filter(enrollment=instance, title=f"Opłata za {instance.studies_edition.studies.name}").exists():
        return
    create_tuition_fee(instance, instance.studies_edition)