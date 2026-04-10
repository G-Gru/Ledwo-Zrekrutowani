import datetime

from django.db import transaction

from payments.models import Fees, Payments, PaymentsHistory


def create_fee_for_enrollment(enrollment, edition):
    Fees.objects.create(
        enrollment=enrollment,
        title=f"Opłata za {edition.studies.name}",
        amount=edition.price,
        due_date=edition.start_date,
    )


def pay_fee(fee):
    with transaction.atomic():
        payment = Payments.objects.create(
            fee=fee,
            payment_method="MOCK",
            reference_number=67,
            status="COMPLETED",
        )
        PaymentsHistory.objects.create(
            payment=payment,
            previous_status=None,
            new_status="COMPLETED",
        )
        fee.paid_date = datetime.date.today()
        fee.save()