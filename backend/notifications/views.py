import logging

from rest_framework import generics, status
from rest_framework.response import Response

from notifications.exceptions import NotificationSendFailedException
from notifications.serializers import SendNotificationSerializer
from notifications.services import send_notif_to
from users.models import User
from users.permissions import IsEmployee

logger = logging.getLogger(__name__)

## ADMIN
class SendNotificationView(generics.CreateAPIView):
    serializer_class = SendNotificationSerializer
    permission_classes = [IsEmployee]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        emails = serializer.validated_data["emails"]
        notification_subject = serializer.validated_data["notification_subject"]
        notification_body = serializer.validated_data["notification_body"]
        use_own_name_as_sender = serializer.validated_data["use_own_name_as_sender"]

        users = list(User.objects.filter(email__in=emails))
        found_emails = {user.email for user in users}
        failed_emails = [email for email in emails if email not in found_emails]

        footer_sender = None
        if use_own_name_as_sender:
            footer_sender = request.user.to_fullname()

        sent_count = 0
        for user in users:
            try:
                send_notif_to(
                    user=user,
                    subject=notification_subject,
                    body=notification_body,
                    footer_sender=footer_sender,
                )
                sent_count += 1
            except NotificationSendFailedException:
                logger.warning(f"Failed to send notification for {user} - {notification_subject}")
                failed_emails.append(user.email)

        response_status = (
            status.HTTP_200_OK
            if not failed_emails
            else status.HTTP_207_MULTI_STATUS
        )

        return Response(
            {
                "sent_count": sent_count,
                "failed_emails": failed_emails,
            },
            status=response_status,
        )