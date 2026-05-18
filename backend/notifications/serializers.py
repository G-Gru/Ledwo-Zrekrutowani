from rest_framework import serializers

class SendNotificationSerializer(serializers.Serializer):
    emails = serializers.ListField(
        child=serializers.EmailField(),
        allow_empty=False,
    )
    notification_subject = serializers.CharField()
    notification_body = serializers.CharField()
    use_own_name_as_sender = serializers.BooleanField(default=False)