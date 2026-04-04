from rest_framework import status
from rest_framework.exceptions import APIException


class UserAlreadyEnrolledException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'User is already enrolled'

class NoPlacesAvailableException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = 'No free places available'

class MissingDocumentsException(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Missing enrollment documents'