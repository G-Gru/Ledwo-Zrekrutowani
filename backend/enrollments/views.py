from django.db.models import Count, Subquery, OuterRef, Q, BooleanField, ExpressionWrapper
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.services import send_notif_to
from payments.models import Fee
from payments.serializers import FeeSerializer
from studies.models import StudiesEdition, StudiesEditionStaff, StudiesDocument
from users.permissions import IsObjectOwner, IsStudent, CanViewDocument, IsEmployee
from . import services
from .models import Enrollment, FormData, Address, SubmittedDocument, DocumentHistory
from .serializers import AdminEnrollmentSerializer, AdminEnrollmentDetailSerializer, FormDataSerializer, \
    AddressSerializer, EnrollmentSerializer, ActiveEnrollmentSerializer, \
    EnrollmentRecruitmentEndDateSerializer, SubmittedDocumentsCreateSerializer, SubmittedDocumentsListSerializer
from .services import get_enrollable_edition


def _scope_enrollments_queryset_for_user(enrollments_qs, user):
    if user.is_staff:
        return enrollments_qs

    assigned_edition_ids = list(
        StudiesEditionStaff.objects.filter(user=user)
        .values_list('studies_edition_id', flat=True)
    )

    if not assigned_edition_ids:
        return enrollments_qs.none()

    return enrollments_qs.filter(studies_edition_id__in=assigned_edition_ids)


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
        return get_object_or_404(
            FormData,
            enrollment__studies_edition_id = edition_pk,
            enrollment__user = self.request.user
        )

    def perform_update(self, serializer):
        edition_pk = self.kwargs['edition_pk']
        get_enrollable_edition(edition_pk)
        services.update_enrollment_form(edition_pk, self.request.user, serializer)

class EnrollmentPreviousFormRetrieveAPIView(generics.RetrieveAPIView):
    serializer_class = FormDataSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_object(self):
        return services.get_previous_form(self.request.user)

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
        entry_fee_subquery = Fee.objects.filter(
            enrollment=OuterRef('pk'),
            title__icontains='Opłata rekrutacyjna'
        ).order_by('-id').values('paid_date')[:1]

        return Enrollment.objects.filter(
            user=self.request.user,
            status__in=Enrollment.Status.active()
        ).annotate(
            entry_payment_date=Subquery(entry_fee_subquery),
            is_draft_application=ExpressionWrapper(
                Q(status=Enrollment.Status.DRAFT),
                output_field=BooleanField()
            )
        ).prefetch_related(
            'studies_edition__studiesdocument_set',
            'submitteddocument_set'
        )

class EnrollmentRetrieveDestroyAPIView(generics.RetrieveDestroyAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAuthenticated, IsStudent, IsObjectOwner]
    lookup_url_kwarg = 'enrollment_pk'

    def get_queryset(self):
        return Enrollment.objects.filter(
            user=self.request.user
        )

    def perform_destroy(self, instance):
        services.resign(instance)

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

class FeeListAPIView(generics.ListAPIView):
    serializer_class = FeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Fee.objects.filter(
            enrollment_id=self.kwargs['enrollment_pk'],
            enrollment__user=self.request.user
        ).prefetch_related('payments')
## ADMIN

class AdminEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    # W przyszłości dodać permission_classes = [IsAdminUser]
    permission_classes = [IsEmployee, IsAuthenticated]
    serializer_class = AdminEnrollmentSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AdminEnrollmentDetailSerializer
        return AdminEnrollmentSerializer

    def get_queryset(self):
        base_qs = Enrollment.objects.exclude(status=Enrollment.Status.DRAFT)

        if self.action in ['retrieve', 'decide', 'get_details', 'get_documents', 'get_fees', 'accept', 'reject', 'send_payment_reminder']:
            qs = base_qs.select_related(
                'user',
                'studies_edition',
                'form', 'form__residential_address', 'form__registered_address',
            ).prefetch_related('fees', 'submitteddocument_set')
            return _scope_enrollments_queryset_for_user(qs, self.request.user)

        qs = base_qs.select_related('user', 'studies_edition').prefetch_related('fees', 'submitteddocument_set')
        qs = _scope_enrollments_queryset_for_user(qs, self.request.user)
        
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

        user = enrollment.user
        subject = f"Przypomnienie o płatności - {edition_name}"
        body = (f"Przypominamy o konieczności uregulowania opłat za studia: {edition_name}.\n" +
                "Prosimy o jak najszybsze dokonanie wpłaty.")
        send_notif_to(user, subject, body)

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
        serializer = FeeSerializer(enrollment.fees.all(), many=True)
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

        services.check_and_promote_candidate_to_student(document.enrollment)

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


class AdminRecruitmentStatsAPIView(generics.GenericAPIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        enrollments_qs = Enrollment.objects.select_related(
            'studies_edition__studies'
        ).prefetch_related(
            'fees',
            'submitteddocument_set',
        )
        enrollments_qs = _scope_enrollments_queryset_for_user(enrollments_qs, request.user)
        enrollment_list = list(enrollments_qs)

        edition_ids = {e.studies_edition_id for e in enrollment_list}
        required_docs_per_edition = {}
        if edition_ids:
            required_docs_per_edition = dict(
                StudiesDocument.objects.filter(
                    studies_edition_id__in=edition_ids,
                    required=True,
                ).values('studies_edition_id').annotate(
                    count=Count('id')
                ).values_list('studies_edition_id', 'count')
            )

        stats = {}
        for enrollment in enrollment_list:
            edition = enrollment.studies_edition
            studies_name = edition.studies.name
            academic_year = edition.academic_year
            key = f"{studies_name}::{academic_year}"

            if key not in stats:
                stats[key] = {
                    'edition_id': key,
                    'studies_name': studies_name,
                    'academic_year': academic_year,
                    'candidates_total': 0,
                    'paid_entries_count': 0,
                    'unpaid_entries_count': 0,
                    'missing_documents_count': 0,
                    'statuses': {'candidate': 0, 'student': 0, 'expelled': 0},
                    'amounts': {'total_fees': 0.0, 'paid_fees': 0.0, 'unpaid_fees': 0.0},
                }

            row = stats[key]
            row['candidates_total'] += 1

            fees = list(enrollment.fees.all())
            is_fully_paid = all(f.paid_date is not None for f in fees)
            if is_fully_paid:
                row['paid_entries_count'] += 1
            else:
                row['unpaid_entries_count'] += 1

            for fee in fees:
                amount = float(fee.amount)
                row['amounts']['total_fees'] += amount
                if fee.paid_date:
                    row['amounts']['paid_fees'] += amount
                else:
                    row['amounts']['unpaid_fees'] += amount

            required_count = required_docs_per_edition.get(enrollment.studies_edition_id, 0)
            accepted_count = sum(
                1 for d in enrollment.submitteddocument_set.all()
                if d.status == 'ACCEPTED'
            )
            if required_count > accepted_count:
                row['missing_documents_count'] += 1

            if enrollment.status == Enrollment.Status.STUDENT:
                row['statuses']['student'] += 1
            elif enrollment.status in Enrollment.Status.non_active():
                row['statuses']['expelled'] += 1
            else:
                row['statuses']['candidate'] += 1

        return Response(list(stats.values()))


class AdminUsosExportAPIView(generics.GenericAPIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        enrollments_qs = Enrollment.objects.exclude(
            status=Enrollment.Status.DRAFT
        ).select_related(
            'user',
            'studies_edition__studies',
            'form',
        ).prefetch_related(
            'fees',
            'submitteddocument_set',
        )
        enrollments_qs = _scope_enrollments_queryset_for_user(enrollments_qs, request.user)
        enrollment_list = list(enrollments_qs)

        edition_ids = {e.studies_edition_id for e in enrollment_list}
        required_docs_per_edition = {}
        if edition_ids:
            required_docs_per_edition = dict(
                StudiesDocument.objects.filter(
                    studies_edition_id__in=edition_ids,
                    required=True,
                ).values('studies_edition_id').annotate(
                    count=Count('id')
                ).values_list('studies_edition_id', 'count')
            )

        result = []
        for enrollment in enrollment_list:
            form = getattr(enrollment, 'form', None)
            fees = list(enrollment.fees.all())
            is_fully_paid = all(f.paid_date is not None for f in fees)

            required_count = required_docs_per_edition.get(enrollment.studies_edition_id, 0)
            accepted_count = sum(
                1 for d in enrollment.submitteddocument_set.all()
                if d.status == 'ACCEPTED'
            )

            result.append({
                'id': enrollment.id,
                'student_name': f"{enrollment.user.first_name} {enrollment.user.last_name}",
                'pesel': form.pesel if form else '',
                'email': form.email if form else '',
                'studies_name': enrollment.studies_edition.studies.name,
                'status': enrollment.status,
                'is_fully_paid': is_fully_paid,
                'missing_documents': required_count > accepted_count,
            })

        return Response(result)