from rest_framework import serializers

from payments.models import Fees, Payments


class PaymentsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payments
        fields = ('id', 'payment_method', 'reference_number', 'status')


class FeesSerializer(serializers.ModelSerializer):
    payments = PaymentsSerializer(many=True, read_only=True)

    class Meta:
        model = Fees
        fields = ('id', 'title', 'amount', 'due_date', 'issued_date', 'paid_date', 'payments')


class FeesWithEditionSerializer(serializers.ModelSerializer):
    payments = PaymentsSerializer(many=True, read_only=True)
    studies_name = serializers.CharField(source='enrollment.studies_edition.studies.name', read_only=True)
    enrollment_id = serializers.IntegerField(source='enrollment.id', read_only=True)

    class Meta:
        model = Fees
        fields = ('id', 'title', 'amount', 'due_date', 'issued_date', 'paid_date', 'enrollment_id', 'studies_name', 'payments')