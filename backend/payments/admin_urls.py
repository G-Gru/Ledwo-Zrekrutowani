from django.urls import path
from payments.views import AdminFeesListAPIView, AdminPaymentsListAPIView

urlpatterns = [
    path("fees/", AdminFeesListAPIView.as_view(), name="admin-finances-fees"),
    path("transactions/", AdminPaymentsListAPIView.as_view(), name="admin-finances-transactions"),
]