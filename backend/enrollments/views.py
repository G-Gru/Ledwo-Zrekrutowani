from django.core.mail import send_mail
from django.conf import settings
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments.models import Fees
from payments.serializers import FeesSerializer
from studies.models import StudiesEdition
from users.permissions import IsObjectOwner, IsStudent, CanViewDocument, IsEmployee
from . import services
from .models import Enrollment, FormData, Address, SubmittedDocument, DocumentHistory
from .serializers import AdminEnrollmentSerializer, AdminEnrollmentDetailSerializer, FormDataSerializer, \
    AddressSerializer, EnrollmentSerializer, ActiveEnrollmentSerializer, \
    EnrollmentRecruitmentEndDateSerializer, SubmittedDocumentsCreateSerializer, SubmittedDocumentsListSerializer
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
    permission_classes = [IsAuthenticated, IsStudent, CanViewDocument]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SubmittedDocumentsCreateSerializer
        return SubmittedDocumentsListSerializer

    def get_queryset(self):
        return SubmittedDocument.objects.filter(
            enrollment_id=self.kwargs['enrollment_pk'],
            enrollment__user=self.request.user,
        )

    def perform_create(self, serializer):
        services.submit_document(self.kwargs['enrollment_pk'], self.request.user, serializer)

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
    permission_classes = [IsEmployee]
    serializer_class = AdminEnrollmentSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminEnrollmentDetailSerializer
        return AdminEnrollmentSerializer

    def get_queryset(self):
        if self.action in ['retrieve', 'decide']:
            return Enrollment.objects.all().select_related(
                'user',
                'form', 'form__residential_address', 'form__registered_address',
            ).prefetch_related('fees', 'submitteddocument_set')

        qs = Enrollment.objects.all().select_related('user').prefetch_related('fees')
        
        # Filtrowanie po nieopłaconych, jeśli w URL pojawi się ?unpaid_only=true
        unpaid_only = self.request.query_params.get('unpaid_only')
        if unpaid_only == 'true':
            qs = qs.filter(fees__paid_date__isnull=True).distinct()
        return qs

    @action(detail=True, methods=['post'], url_path='accept')
    def accept(self, request, pk=None):
        enrollment = self.get_object()
        note = request.data.get('status_note', '')

        enrollment.status = Enrollment.Status.STUDENT
        enrollment.status_note = note
        enrollment.save(update_fields=['status', 'status_note'])

        serializer = AdminEnrollmentDetailSerializer(enrollment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        enrollment = self.get_object()
        note = request.data.get('status_note', '')

        enrollment.status = Enrollment.Status.EXPELLED
        enrollment.status_note = note
        enrollment.save(update_fields=['status', 'status_note'])

        serializer = AdminEnrollmentDetailSerializer(enrollment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='send-payment-reminder')
    def send_payment_reminder(self, request, pk=None):
        enrollment = self.get_object()
        edition_name = (StudiesEdition.objects
                        .filter(pk=enrollment.studies_edition_id)
                        .values_list('studies__name', flat=True)
                        .first()) or 'wybrane studia'
        
        unpaid_fees = enrollment.fees.filter(paid_date__isnull=True)
        if not unpaid_fees.exists():
            return Response(
                {"error": "Ten kandydat uregulował wszystkie opłaty."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subject = f"Przypomnienie o płatności - {edition_name}"
        message = (
            f"Dzień dobry {enrollment.user.first_name},\n\n"
            f"Przypominamy o konieczności uregulowania opłat za studia: {edition_name}.\n"
            "Prosimy o jak najszybsze dokonanie wpłaty.\n\n"
            "Pozdrawiamy,\n"
            "Zespół Ledwo Zrekrutowani"
        )
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [enrollment.user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {"error": f"Nie udało się wysłać e-maila: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return Response({
            "message": f"Przypomnienie o płatności zostało wysłane do: {enrollment.user.email}"
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='details')
    def get_details(self, request, pk=None):
        enrollment = self.get_object()
        serializer = AdminEnrollmentDetailSerializer(
            enrollment,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='documents')
    def get_documents(self, request, pk=None):
        enrollment = self.get_object()
        serializer = SubmittedDocumentsListSerializer(
            enrollment.submitteddocument_set.all(),
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='fees')
    def get_fees(self, request, pk=None):
        enrollment = self.get_object()
        serializer = FeesSerializer(enrollment.fees.all(), many=True)
        return Response(serializer.data)


class AdminDocumentAcceptAPIView(generics.GenericAPIView):
    permission_classes = [IsEmployee]
    serializer_class = SubmittedDocumentsListSerializer

    def post(self, request, enrollment_pk, document_pk):
        """Accept a submitted document"""
        document = get_object_or_404(
            SubmittedDocument,
            id=document_pk,
            enrollment_id=enrollment_pk
        )

        note = request.data.get('note', '')
        previous_status = document.status

        document.status = SubmittedDocument.Status.ACCEPTED
        document.save(update_fields=['status'])

        try:
            staff = request.user.studies_edition_staff.first()
            if staff:
                DocumentHistory.objects.create(
                    staff=staff,
                    submitted_document=document,
                    previous_status=previous_status,
                    new_status=document.status,
                    note=note
                )
        except Exception:
            pass

        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminDocumentRejectAPIView(generics.GenericAPIView):
    permission_classes = [IsEmployee]
    serializer_class = SubmittedDocumentsListSerializer

    def post(self, request, enrollment_pk, document_pk):
        """Reject a submitted document"""
        document = get_object_or_404(
            SubmittedDocument,
            id=document_pk,
            enrollment_id=enrollment_pk
        )

        note = request.data.get('note', '')
        previous_status = document.status

        document.status = SubmittedDocument.Status.REJECTED
        document.save(update_fields=['status'])

        try:
            staff = request.user.studies_edition_staff.first()
            if staff:
                DocumentHistory.objects.create(
                    staff=staff,
                    submitted_document=document,
                    previous_status=previous_status,
                    new_status=document.status,
                    note=note
                )
        except Exception:
            pass

        serializer = self.get_serializer(document)
        return Response(serializer.data, status=status.HTTP_200_OK)