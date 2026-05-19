from rest_framework import status
from rest_framework.exceptions import APIException


class NotificationSendFailedException(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = 'Notification send failed'