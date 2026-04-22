from django.shortcuts import get_object_or_404
from rest_framework import generics, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from payments import services
from payments.models import Fees, Payments
from payments.serializers import FeesWithEditionSerializer, AdminFeeSerializer, AdminPaymentSerializer
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


class AdminPaymentApproveAPIView(views.APIView):
    permission_classes = [IsEmployee]

    def post(self, request, payment_pk):
        payment = get_object_or_404(Payments, pk=payment_pk)
        if payment.status != "PENDING":
            return Response({"detail": "Ta płatność nie oczekuje na zatwierdzenie."}, status=status.HTTP_400_BAD_REQUEST)
        services.approve_payment(payment)
        return Response({"detail": "Płatność zatwierdzona."}, status=status.HTTP_200_OK)