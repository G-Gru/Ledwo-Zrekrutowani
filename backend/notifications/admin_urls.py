from django.urls import path

from notifications.views import SendNotificationView

urlpatterns = [
    path("new/",
         SendNotificationView.as_view(),
         name="admin-notifications-send"),
]