from smtplib import SMTPException

from django.core.mail import send_mail

from core import settings
from notifications.exceptions import NotificationSendFailedException


def send_notif_to(user, subject, body, header=None, footer=None, footer_sender=None):
    content = _build_notif_content(body, header=header, header_recipient=user.to_fullname(), footer=footer,
                                   footer_sender=footer_sender)

    _system_send_mail(subject, content, [user.email])
    # Other notifications ...

def send_notif_to_many(recipients, subject, body, header=None, footer=None, footer_sender=None):
    for user in recipients:
        send_notif_to(user, subject, body, header=header, footer=footer, footer_sender=footer_sender)

def _build_notif_content(body, header=None, header_recipient=None, footer=None, footer_sender=None):
    if not header:
        if not header_recipient:
            header_recipient = ""

        header =  f"Dzień dobry {header_recipient},"

    if not footer:
        if footer_sender:
            footer = f"Pozdrawiam,\n{footer_sender}"
        else:
            footer = "Pozdrawiamy,\nZespół Ledwo Zrekrutowani"

    content = "\n\n".join([header, body, footer])
    return content

def _system_send_mail(subject, content, recipient_emails):
    try:
        send_mail(
            subject,
            content,
            settings.DEFAULT_FROM_EMAIL,
            recipient_emails,
        )
    except SMTPException as e:
        raise NotificationSendFailedException(e)
