from rest_framework import serializers

from files.models import File
from payments.serializers import FeeSerializer
from studies.models import StudiesEdition, StudiesDocument
from studies.serializers import StudiesEditionListSerializer, StudiesDocumentSerializer
from .models import Enrollment, SubmittedDocument, FormData, Address, DocumentHistory
from .validators import is_valid_pesel, pesel_to_birthdate, is_valid_phone, is_valid_education_year, is_at_least_18


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    is_fully_paid = serializers.SerializerMethodField()
    missing_documents = serializers.SerializerMethodField()
    system_status = serializers.SerializerMethodField()
    studies_name = serializers.SerializerMethodField()
    edition_name = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student_name', 'status', 'status_note', 'enrollment_date',
            'is_fully_paid', 'missing_documents', 'system_status',
            'studies_name', 'edition_name'
        ]

    def get_student_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_is_fully_paid(self, obj):
        # Weryfikacja opłat
        return not obj.fees.filter(paid_date__isnull=True).exists()

    def get_missing_documents(self, obj):
        # Weryfikacja wymaganych dokumentów ze StudiesDocuments i SubmittedDocuments
        required_count = StudiesDocument.objects.filter(
            studies_edition_id=obj.studies_edition_id,
            required=True
        ).count()
        accepted_count = obj.submitteddocument_set.filter(status='ACCEPTED').count()
        return required_count > accepted_count

    def get_studies_name(self, obj):
        edition = (StudiesEdition.objects
                   .filter(pk=obj.studies_edition_id)
                   .values('studies__name')
                   .first())
        return edition.get('studies__name') if edition else '-'

    def get_edition_name(self, obj):
        return self.get_studies_name(obj)

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

    files_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True
    )

    files_uploads = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = FormData
        exclude = ('modified_date', )
        read_only_fields = ('enrollment', )

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

        birth_date = attrs.get("birth_date")
        if not is_at_least_18(birth_date):
            raise serializers.ValidationError("You must be 18 years old.")

        pesel = attrs.get("pesel")
        if not is_valid_pesel(pesel):
            raise serializers.ValidationError("PESEL is not valid")

        if birth_date != pesel_to_birthdate(pesel):
            raise serializers.ValidationError("Birth date does not match with PESEL")

        phone = attrs.get("phone")
        if not is_valid_phone(phone):
            raise serializers.ValidationError("Phone is not valid")

        education_year = attrs.get("education_year")
        if not is_valid_education_year(education_year):
            raise serializers.ValidationError("Education year is not valid")

    return attrs

class SubmittedDocumentsListSerializer(serializers.ModelSerializer):
    studies_document = StudiesDocumentSerializer()

    class Meta:
        model = SubmittedDocument
        exclude = ('enrollment', )
        read_only_fields = ('id', 'status', 'submitted_date', 'file')

class SubmittedDocumentsCreateSerializer(serializers.ModelSerializer):
    file = SubmittedFileSerializer(required=True, write_only=True)

    class Meta:
        model = File
        fields = ('file', )

    def validate(self, attrs):
        file = attrs["file"]
        doc_id = file["studies_document_id"]

        try:
            studies_document = StudiesDocument.objects.get(id=doc_id)
        except StudiesDocument.DoesNotExist:
            raise serializers.ValidationError("Invalid studies_document_id")

        if studies_document.is_read_only:
            raise serializers.ValidationError(
                "Cannot override read only documents"
            )

        return attrs

class EnrollmentRecruitmentEndDateSerializer(serializers.ModelSerializer):
    recruitment_end_date = serializers.DateTimeField(source='studies_edition.recruitment_end_date', read_only=True)

    class Meta:
        model = Enrollment
        fields = ('recruitment_end_date',)

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


class StudiesEditionForCandidateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='studies.name', read_only=True)

    class Meta:
        model = StudiesEdition
        fields = ('id', 'name', 'price', 'start_date', 'end_date', 'recruitment_end_date', 'status')


class ActiveEnrollmentSerializer(serializers.ModelSerializer):
    studies_edition = StudiesEditionForCandidateSerializer(read_only=True)

    entry_payment_date = serializers.DateField(read_only=True)
    is_draft_application = serializers.BooleanField(read_only=True)
    all_documents_accepted_date = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        exclude = ('user', )

    def get_all_documents_accepted_date(self, obj):
        confirmed_statuses = SubmittedDocument.Status.confirmed()

        # All required (non-read-only) docs must be in ACCEPTED or VERIFIED state
        missing_confirmed = StudiesDocument.objects.filter(
            studies_edition=obj.studies_edition,
            required=True,
            is_read_only=False,
        ).exclude(
            submitted_documents__enrollment=obj,
            submitted_documents__status__in=confirmed_statuses,
        )
        if missing_confirmed.exists():
            return None

        # Try to get the date from history (ACCEPTED or VERIFIED)
        last_history = DocumentHistory.objects.filter(
            submitted_document__enrollment=obj,
            new_status__in=confirmed_statuses,
        ).order_by('-modified_date').first()

        if last_history:
            return str(last_history.modified_date.date())

        # Fallback for seeded data where history records don't exist:
        # use the latest submitted_date of a confirmed document
        latest_doc = obj.submitteddocument_set.filter(
            status__in=confirmed_statuses,
        ).order_by('-submitted_date').first()
        if latest_doc:
            return str(latest_doc.submitted_date.date())

        return None

class AdminFormDataSerializer(serializers.ModelSerializer):
    residential_address = AddressSerializer(read_only=True)
    registered_address = AddressSerializer(read_only=True)

    class Meta:
        model = FormData
        exclude = ('enrollment',)

class AdminEnrollmentDetailSerializer(AdminEnrollmentSerializer):
    form_data = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    payments = FeeSerializer(source='fees', many=True, read_only=True)

    class Meta(AdminEnrollmentSerializer.Meta):
        fields = AdminEnrollmentSerializer.Meta.fields + ['form_data', 'documents', 'payments']

    def get_form_data(self, obj):
        try:
            return AdminFormDataSerializer(getattr(obj, 'form', None)).data if getattr(obj, 'form', None) else None
        except FormData.DoesNotExist:
            return None

    def get_documents(self, obj):
        return SubmittedDocumentsListSerializer(
            obj.submitteddocument_set.all(),
            many=True,
            context=self.context,
        ).data