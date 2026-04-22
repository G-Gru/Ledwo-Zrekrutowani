import datetime

from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments import services
from payments.models import Fees, Payments
from payments.serializers import FeesWithEditionSerializer, AdminFeeSerializer, AdminPaymentSerializer
from studies.models import StudiesEdition
from users.permissions import IsStudent, IsEmployee


class PaymentHistoryListAPIView(generics.ListAPIView):
    serializer_class = FeesWithEditionSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        return (Fees.objects
                .filter(enrollment__user=self.request.user, paid_date__isnull=False)
                .select_related('enrollment__studies_edition__studies')
                .prefetch_related('payments')
                .order_by('-paid_date'))


class PaymentUpcomingListAPIView(generics.ListAPIView):
    serializer_class = FeesWithEditionSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        return (Fees.objects
                .filter(enrollment__user=self.request.user, paid_date__isnull=True)
                .select_related('enrollment__studies_edition__studies')
                .prefetch_related('payments')
                .order_by('due_date'))


class PayFeeAPIView(views.APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request, fee_pk):
        fee = get_object_or_404(Fees, pk=fee_pk, enrollment__user=request.user)
        if fee.paid_date is not None:
            return Response({"detail": "Ta opłata została już uregulowana."}, status=status.HTTP_400_BAD_REQUEST)
        proof_file = request.FILES.get('file')
        services.pay_fee(fee, proof_file=proof_file)
        return Response({"detail": "Płatność zrealizowana."}, status=status.HTTP_200_OK)


class AdminFeesListAPIView(generics.ListAPIView):
    permission_classes = [IsEmployee]
    serializer_class = AdminFeeSerializer

    def get_queryset(self):
        return Fees.objects.select_related(
            'enrollment__user',
            'enrollment__form',
            'enrollment__studies_edition__studies'
        ).all().order_by('-issued_date')


class AdminPaymentsListAPIView(generics.ListAPIView):
    permission_classes = [IsEmployee]
    serializer_class = AdminPaymentSerializer

    def get_queryset(self):
        return Payments.objects.select_related(
            'fee__enrollment__user',
            'fee__enrollment__form'
        ).all().order_by('-id')


class AdminFinanceDashboardAPIView(views.APIView):
    permission_classes = [IsEmployee]

    def get(self, request):
        today = datetime.date.today()

        fees_qs = Fees.objects.all()

        total_collected = fees_qs.filter(paid_date__isnull=False).aggregate(
            s=Sum('amount'))['s'] or 0
        total_pending = fees_qs.filter(paid_date__isnull=True, due_date__gte=today).aggregate(
            s=Sum('amount'))['s'] or 0
        total_overdue = fees_qs.filter(paid_date__isnull=True, due_date__lt=today).aggregate(
            s=Sum('amount'))['s'] or 0
        pending_transfers_count = Payments.objects.filter(status="PENDING").count()

        editions = (StudiesEdition.objects
                    .filter(enrollment__fees__isnull=False)
                    .distinct()
                    .select_related('studies')
                    .annotate(
                        fees_count=Count('enrollment__fees', distinct=True),
                        collected=Sum('enrollment__fees__amount',
                                     filter=Q(enrollment__fees__paid_date__isnull=False)),
                        pending=Sum('enrollment__fees__amount',
                                   filter=Q(enrollment__fees__paid_date__isnull=True,
                                            enrollment__fees__due_date__gte=today)),
                        overdue=Sum('enrollment__fees__amount',
                                   filter=Q(enrollment__fees__paid_date__isnull=True,
                                            enrollment__fees__due_date__lt=today)),
                    ))

        editions_data = [
            {
                "edition_id": e.id,
                "studies_name": e.studies.name,
                "academic_year": e.academic_year,
                "fees_count": e.fees_count,
                "collected": e.collected or 0,
                "pending": e.pending or 0,
                "overdue": e.overdue or 0,
            }
            for e in editions
        ]

        return Response({
            "overall": {
                "total_collected": total_collected,
                "total_pending": total_pending,
                "total_overdue": total_overdue,
                "pending_transfers_count": pending_transfers_count,
            },
            "by_edition": editions_data,
        })


class AdminPaymentApproveAPIView(views.APIView):
    permission_classes = [IsEmployee]

    def post(self, request, payment_pk):
        payment = get_object_or_404(Payments, pk=payment_pk)
        if payment.status != "PENDING":
            return Response({"detail": "Ta płatność nie oczekuje na zatwierdzenie."}, status=status.HTTP_400_BAD_REQUEST)
        services.approve_payment(payment)
        return Response({"detail": "Płatność zatwierdzona."}, status=status.HTTP_200_OK)