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


class AdminFeeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    studies_name = serializers.CharField(source='enrollment.studies_edition.studies.name', read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Fees
        fields = ('id', 'title', 'amount', 'due_date', 'issued_date', 'paid_date', 'status', 'student_name', 'studies_name', 'enrollment')

    def get_student_name(self, obj):
        if hasattr(obj.enrollment, 'form'):
            return f"{obj.enrollment.form.first_name} {obj.enrollment.form.last_name}".strip()
        return obj.enrollment.user.email

    def get_status(self, obj):
        return "paid" if obj.paid_date else "unpaid"


class AdminPaymentSerializer(serializers.ModelSerializer):
    fee_title = serializers.CharField(source='fee.title', read_only=True)
    amount = serializers.DecimalField(source='fee.amount', max_digits=10, decimal_places=2, read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Payments
        fields = ('id', 'fee', 'fee_title', 'amount', 'payment_method', 'reference_number', 'status', 'student_name')

    def get_student_name(self, obj):
        if hasattr(obj.fee.enrollment, 'form'):
            return f"{obj.fee.enrollment.form.first_name} {obj.fee.enrollment.form.last_name}".strip()
        return obj.fee.enrollment.user.email