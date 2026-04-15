from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments.models import Fees
from payments.serializers import FeesSerializer
from users.permissions import IsObjectOwner, IsStudent
from . import services
from .models import Enrollment, FormData, Address, SubmittedDocument
from .serializers import AdminEnrollmentSerializer, AdminEnrollmentDetailSerializer, FormDataSerializer, \
    AddressSerializer, EnrollmentSerializer, ActiveEnrollmentSerializer, \
    SubmittedDocumentsListCreateSerializer, EnrollmentRecruitmentEndDateSerializer
from .services import get_enrollable_edition


## PUBLIC
class EnrollmentFormCreateAPIView(generics.CreateAPIView):
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def perform_create(self, serializer):
        edition_pk = self.kwargs['edition_pk']
        get_enrollable_edition(edition_pk)
        services.create_enrollment_form(edition_pk, self.request.user, serializer)

class EnrollmentFormRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated, IsStudent]

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
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AddressRetreiveDestroyAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]
    lookup_url_kwarg = 'address_pk'

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )

class EnrollmentListAPIView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        )

class ActiveEnrollmentListAPIView(generics.ListAPIView):
    serializer_class = ActiveEnrollmentSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        ).exclude(status=Enrollment.Status.EXPELLED)

class EnrollmentRetrieveAPIView(generics.RetrieveAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]
    lookup_url_kwarg = 'enrollment_pk'

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        )

class SubmittedDocumentsListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = SubmittedDocumentsListCreateSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]

    def get_queryset(self):
        return SubmittedDocument.objects.filter(
            enrollment_id=self.kwargs['enrollment_pk'],
            enrollment__user=self.request.user,
        )

    def perform_create(self, serializer):
        get_object_or_404(
            Enrollment,
            pk=self.kwargs['enrollment_pk'],
            user=self.request.user
        )

        serializer.save(enrollment_id=self.kwargs['enrollment_pk'])

class EnrollmentRecruitmentEndDateAPIView(generics.RetrieveAPIView):
    serializer_class = EnrollmentRecruitmentEndDateSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'enrollment_pk'

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        ).select_related('studies_edition')

class FeesListAPIView(generics.ListAPIView):
    serializer_class = FeesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Fees.objects.filter(
            enrollment_id=self.kwargs['enrollment_pk'],
            enrollment__user=self.request.user
        ).prefetch_related('payments')


## ADMIN

class AdminEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    # W przyszłości dodać permission_classes = [IsAdminUser]
    serializer_class = AdminEnrollmentSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminEnrollmentDetailSerializer
        return AdminEnrollmentSerializer

    def get_queryset(self):
        if self.action == 'retrieve':
            return Enrollment.objects.all().select_related(
                'user', 'studies_edition',
                'formdata', 'formdata__residential_address', 'formdata__registered_address',
            ).prefetch_related('fees', 'submitteddocument_set')

        qs = Enrollment.objects.all().select_related('user', 'studies_edition').prefetch_related('fees')
        
        # Filtrowanie po nieopłaconych, jeśli w URL pojawi się ?unpaid_only=true
        unpaid_only = self.request.query_params.get('unpaid_only')
        if unpaid_only == 'true':
            qs = qs.filter(fees__paid_date__isnull=True).distinct()
        return qs

    @action(detail=True, methods=['post'], url_path='decide')
    def decide(self, request, pk=None):
        enrollment = self.get_object()
        decision = request.data.get('decision')
        note = request.data.get('note', '')

        if decision not in ('accept', 'reject'):
            return Response(
                {'error': 'decision must be "accept" or "reject"'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        enrollment.status = (
            Enrollment.Status.STUDENT if decision == 'accept' else Enrollment.Status.EXPELLED
        )
        enrollment.status_note = note
        enrollment.save(update_fields=['status', 'status_note'])

        serializer = AdminEnrollmentDetailSerializer(enrollment)
        return Response(serializer.data)

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