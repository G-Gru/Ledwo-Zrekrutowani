from django.urls import path
from payments.views import PaymentHistoryListAPIView, PaymentUpcomingListAPIView, PayFeeAPIView

urlpatterns = [
    path("history/", PaymentHistoryListAPIView.as_view(), name="payment-history"),
    path("upcoming/", PaymentUpcomingListAPIView.as_view(), name="payment-upcoming"),
    path("<int:fee_pk>/pay/", PayFeeAPIView.as_view(), name="payment-pay"),
]