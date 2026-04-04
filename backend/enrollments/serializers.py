from random import choices

from rest_framework import serializers

from studies.serializers import StudiesEditionListSerializer
from .models import Enrollment, Fees, SubmittedDocument, FormData, Address


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

class SubmittedFileSerializer(serializers.Serializer):
    studies_document_id = serializers.IntegerField()
    file = serializers.FileField()

class FormDataSerializer(serializers.ModelSerializer):
    action = serializers.ChoiceField(choices=FormData.Action.choices,
                                     required=True,
                                     write_only=True)

    files = SubmittedFileSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = FormData
        exclude = ('modified_date', 'enrollment')

    def validate(self, attrs):
        return form_data_validate(attrs)

    def create(self, validated_data):
        validated_data.pop("action")
        validated_data.pop("files", [])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("action", None)
        validated_data.pop("files", [])
        return super().update(instance, validated_data)


def form_data_validate(attrs):
    action = attrs.get("action")

    if action == FormData.Action.ENROLL:
        required_fields = FormData.REQUIRED_FIELDS
        missing = [
            field for field in required_fields
            if not attrs.get(field)
        ]

        if missing:
            raise serializers.ValidationError({
                field: "This field is required for enrollment."
                for field in missing
            })

    return attrs

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = ('user', )
        read_only = ('id', )

class EnrollmentSerializer(serializers.ModelSerializer):
    studies_edition = StudiesEditionListSerializer(read_only=True)

    class Meta:
        model = Enrollment
        exclude = ('user', )


class SubmittedDocumentsListCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmittedDocument
        exclude = ('id', 'enrollment')
        read_only = ('status', 'submitted_date')