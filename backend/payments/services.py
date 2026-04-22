import datetime

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction

from files.models import File
from payments.models import Fees, Payments, PaymentsHistory


def create_fee_for_enrollment(enrollment, edition):
    fee = Fees.objects.create(
        enrollment=enrollment,
        title=f"Opłata za {edition.studies.name}",
        amount=edition.price,
        due_date=edition.start_date,
    )
    send_fee_issued_email(fee)


def pay_fee(fee, proof_file=None):
    with transaction.atomic():
        file_obj = None
        if proof_file is not None:
            file_obj = File.objects.create(file=proof_file, source=File.Source.PAYMENT)
            payment_status = "PENDING"
        else:
            payment_status = "COMPLETED"

        payment = Payments.objects.create(
            fee=fee,
            payment_method="TRANSFER" if proof_file else "ONLINE",
            reference_number=67,
            status=payment_status,
            file=file_obj,
        )
        PaymentsHistory.objects.create(
            payment=payment,
            previous_status=None,
            new_status=payment_status,
        )

        if payment_status == "COMPLETED":
            fee.paid_date = datetime.date.today()
            fee.save()

    if payment_status == "COMPLETED":
        send_payment_confirmation_email(fee)


def approve_payment(payment):
    with transaction.atomic():
        PaymentsHistory.objects.create(
            payment=payment,
            previous_status=payment.status,
            new_status="COMPLETED",
        )
        payment.status = "COMPLETED"
        payment.save(update_fields=['status'])

        fee = payment.fee
        fee.paid_date = datetime.date.today()
        fee.save(update_fields=['paid_date'])

    send_payment_confirmation_email(payment.fee)


def send_fee_issued_email(fee):
    user = fee.enrollment.user
    due_date_str = fee.due_date.strftime("%d.%m.%Y")
    send_mail(
        subject=f"Nowa opłata: {fee.title}",
        message=(
            f"Dzień dobry {user.first_name},\n\n"
            f"Wystawiono nową opłatę:\n"
            f"  Tytuł: {fee.title}\n"
            f"  Kwota: {fee.amount} PLN\n"
            f"  Termin płatności: {due_date_str}\n\n"
            f"Prosimy o terminowe uregulowanie należności.\n\n"
            f"Pozdrawiamy,\n"
            f"Zespół Ledwo Zrekrutowani"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )


def send_payment_confirmation_email(fee):
    user = fee.enrollment.user
    paid_date_str = fee.paid_date.strftime("%d.%m.%Y")
    send_mail(
        subject=f"Potwierdzenie płatności: {fee.title}",
        message=(
            f"Dzień dobry {user.first_name},\n\n"
            f"Potwierdzamy otrzymanie płatności:\n"
            f"  Tytuł: {fee.title}\n"
            f"  Kwota: {fee.amount} PLN\n"
            f"  Data zapłaty: {paid_date_str}\n\n"
            f"Dziękujemy za terminowe uregulowanie należności.\n\n"
            f"Pozdrawiamy,\n"
            f"Zespół Ledwo Zrekrutowani"
        ),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=True,
    )