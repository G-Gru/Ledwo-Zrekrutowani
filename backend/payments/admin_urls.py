from django.urls import path
from payments.views import (
    AdminFeeListAPIView,
    AdminPaymentListAPIView,
    AdminPaymentApproveAPIView,
    AdminFinanceDashboardAPIView,
)

urlpatterns = [
    path("dashboard/", AdminFinanceDashboardAPIView.as_view(), name="admin-finances-dashboard"),
    path("fees/", AdminFeeListAPIView.as_view(), name="admin-finances-fees"),
    path("transactions/", AdminPaymentListAPIView.as_view(), name="admin-finances-transactions"),
    path("transactions/<int:payment_pk>/approve/", AdminPaymentApproveAPIView.as_view(), name="admin-finances-approve"),
]