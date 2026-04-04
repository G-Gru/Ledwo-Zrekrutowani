from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsObjectOwner
from . import services
from .models import Enrollment, FormData, Address
from .serializers import AdminEnrollmentSerializer, FormDataCreateSerializer, FormDataRetreiveUpdateSerializer, \
    AddressSerializer
from .services import get_enrollable_edition


## PUBLIC
class EnrollmentFormCreateAPIView(generics.CreateAPIView):
    serializer_class = FormDataCreateSerializer
    permission_classes = [IsAuthenticated] #todo students only

    def perform_create(self, serializer):
        edition_pk = self.kwargs['edition_pk']
        get_enrollable_edition(edition_pk)
        services.create_enrollment_form(edition_pk, self.request.user, serializer)

class EnrollmentFormRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = FormDataRetreiveUpdateSerializer
    permission_classes = [IsAuthenticated]  # todo students only

    def get_object(self):
        edition_pk = self.kwargs['edition_pk']
        return FormData.objects.select_related('enrollment').get(
            enrollment__studies_edition_id=edition_pk,
            enrollment__user=self.request.user
        )

    def perform_update(self, serializer):
        edition_pk = self.kwargs['edition_pk']
        get_enrollable_edition(edition_pk)
        services.update_enrollment_form(edition_pk, self.request.user, serializer)

class AddressListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AddressRetreiveDestroyAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsObjectOwner]
    lookup_url_kwarg = 'address_pk'

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

## ADMIN

class AdminEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    # W przyszłości dodać permission_classes = [IsAdminUser]
    serializer_class = AdminEnrollmentSerializer

    def get_queryset(self):
        qs = Enrollment.objects.all().select_related('user', 'studies_edition').prefetch_related('fees')
        
        # Filtrowanie po nieopłaconych, jeśli w URL pojawi się ?unpaid_only=true
        unpaid_only = self.request.query_params.get('unpaid_only')
        if unpaid_only == 'true':
            qs = qs.filter(fees__paid_date__isnull=True).distinct()
        return qs

    @action(detail=True, methods=['post'], url_path='send-payment-reminder')
    def send_payment_reminder(self, request, pk=None):
        enrollment = self.get_object()
        
        unpaid_fees = enrollment.fees.filter(paid_date__isnull=True)
        if not unpaid_fees.exists():
            return Response(
                {"error": "Ten kandydat uregulował wszystkie opłaty."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Tutaj integracja z wysyłką email
        
        return Response({
            "message": f"Przypomnienie o płatności zostało wysłane do: {enrollment.user.email}"
        }, status=status.HTTP_200_OK)