import datetime
import logging
from decimal import Decimal

from django.db import transaction

from enrollments import services
from files.models import File
from notifications.exceptions import NotificationSendFailedException
from notifications.services import send_notif_to
from payments.models import Fee, Payment, PaymentHistory

logger = logging.getLogger(__name__)

def create_application_fee(enrollment, edition):
    fee = Fee.objects.create(
        enrollment=enrollment,
        title=f"Opłata rekrutacyjna za {edition.studies.name}",
        amount=Decimal('100.00'),
        due_date=edition.recruitment_end_date,
    )
    send_fee_issued_notif(fee)

def create_tuition_fee(enrollment, edition):
    fee = Fee.objects.create(
        enrollment=enrollment,
        title=f"Opłata za {edition.studies.name}",
        amount=enrollment.studies_edition.price,
        due_date=datetime.date.today() + datetime.timedelta(days=30),
    )
    send_fee_issued_notif(fee)


def pay_fee(fee, proof_file=None):
    with transaction.atomic():
        file_obj = None
        if proof_file is not None:
            file_obj = File.objects.create(file=proof_file, source=File.Source.PAYMENT)
            payment_status = "PENDING"
        else:
            payment_status = "COMPLETED"

        payment = Payment.objects.create(
            fee=fee,
            payment_method="TRANSFER" if proof_file else "ONLINE",
            reference_number=67,
            status=payment_status,
            file=file_obj,
        )
        PaymentHistory.objects.create(
            payment=payment,
            previous_status=None,
            new_status=payment_status,
        )

        if payment_status == "COMPLETED":
            fee.paid_date = datetime.date.today()
            fee.save()

    if payment_status == "COMPLETED":
        send_payment_confirmation_notif(fee)
        services.check_and_promote_candidate_to_student(fee.enrollment)


def approve_payment(payment):
    with transaction.atomic():
        PaymentHistory.objects.create(
            payment=payment,
            previous_status=payment.status,
            new_status="COMPLETED",
        )
        payment.status = "COMPLETED"
        payment.save(update_fields=['status'])

        fee = payment.fee
        fee.paid_date = datetime.date.today()
        fee.save(update_fields=['paid_date'])

    send_payment_confirmation_notif(payment.fee)
    services.check_and_promote_candidate_to_student(payment.fee.enrollment)


def send_fee_issued_notif(fee):
    due_date_str = fee.due_date.strftime("%d.%m.%Y")
    user = fee.enrollment.user
    subject = f"Nowa opłata - {fee.title}",
    body = (f"Wystawiono nową opłatę:\n" +
            f"\tTytuł: {fee.title}\n" +
            f"\tKwota: {fee.amount} PLN\n" +
            f"\tTermin płatności: {due_date_str}\n\n" +
            f"Prosimy o terminowe uregulowanie należności.")

    try:
        send_notif_to(user, subject, body)
    except NotificationSendFailedException as e:
        logger.warning(f"Notification sending failed - fee issued: {user} {e}")


def send_payment_confirmation_notif(fee):
    user = fee.enrollment.user
    paid_date_str = fee.paid_date.strftime("%d.%m.%Y")
    subject = f"Potwierdzenie płatności - {fee.title}"
    body = (f"Potwierdzamy otrzymanie płatności:\n" +
            f"\tTytuł: {fee.title}\n"
            f"\tKwota: {fee.amount} PLN\n"
            f"\tData zapłaty: {paid_date_str}\n\n"
            f"Dziękujemy za terminowe uregulowanie należności.")

    try:
        send_notif_to(user, subject, body)
    except NotificationSendFailedException as e:
        logger.warning(f"Notification sending failed - payment confirmation: {user} {e}")