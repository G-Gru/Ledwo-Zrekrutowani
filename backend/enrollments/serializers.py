
from rest_framework import serializers
from .models import Enrollment, Fees, SubmittedDocument

class AdminEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    is_fully_paid = serializers.SerializerMethodField()
    missing_documents = serializers.SerializerMethodField()
    system_status = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student_name', 'status', 'status_note', 'enrollment_date',
            'is_fully_paid', 'missing_documents', 'system_status'
        ]

    def get_student_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_is_fully_paid(self, obj):
        # Weryfikacja opłat
        return not obj.fees.filter(paid_date__isnull=True).exists()

    def get_missing_documents(self, obj):
        # Weryfikacja wymaganych dokumentów ze StudiesDocuments i SubmittedDocuments
        required_count = obj.studies_edition.studiesdocument_set.filter(required=True).count()
        accepted_count = obj.submitteddocument_set.filter(status='ACCEPTED').count()
        return required_count > accepted_count

    def get_system_status(self, obj):
        fully_paid = self.get_is_fully_paid(obj)
        docs_missing = self.get_missing_documents(obj)
        
        if fully_paid and not docs_missing:
            return "KOMPLETNE - GOTOWE DO DECYZJI"
        return "NIESPEŁNIONE WYMOGI (Brak Oplat/Dokumentow)"