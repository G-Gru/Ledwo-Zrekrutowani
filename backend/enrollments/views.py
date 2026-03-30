from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Enrollment
from .serializers import AdminEnrollmentSerializer

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