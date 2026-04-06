from django.utils import timezone
from rest_framework import serializers

from studies.models import Studies, StudiesEdition, StudiesEditionStaff, StudiesDocument
from users.models import User
from users.serializers import UserSerializer


class StudiesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Studies
        fields = '__all__'
        read_only_fields = ('id', )

    @staticmethod
    def validate_terms_count(value):
        if value < 1:
            raise serializers.ValidationError('Terms count must be greater than 0')

        return value


class StudiesEditionCreateSerializer(serializers.ModelSerializer):
    studies_id = serializers.PrimaryKeyRelatedField(
        queryset=Studies.objects.all(),
        source='studies'
    )

    def validate(self, attrs):
        start = attrs.get("start_date")
        end = attrs.get("end_date")
        rec_start = attrs.get("recruitment_start_date")
        rec_end = attrs.get("recruitment_end_date")

        if end < start:
            raise serializers.ValidationError({
                "end_date": "Must be greater than start date"
            })

        if rec_end < rec_start:
            raise serializers.ValidationError({
                "recruitment_end_date": "Must be greater than start date"
            })

        if rec_end < start:
            raise serializers.ValidationError({
                "recruitment_end_date": "Must be greater than start date"
            })

        return attrs

    @staticmethod
    def validate_price(value):
        if value < 0:
            raise serializers.ValidationError({
                "price": "Must be greater than zero"
            })

        return value

    class Meta:
        model = StudiesEdition
        exclude = ('studies', )

class StudiesEditionListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='studies.name', read_only=True)

    class Meta:
        model = StudiesEdition
        fields = ('id', 'name', 'price', 'start_date', 'status')

class StudiesEditionDetailsSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='studies.name', read_only=True)
    terms_count = serializers.IntegerField(source='studies.terms_count', read_only=True)
    description = serializers.CharField(source='studies.description', read_only=True)

    class Meta:
        model = StudiesEdition
        exclude = ('studies', )


class StudiesEditionStaffWriteSerializer(serializers.ModelSerializer):
    user_id = serializers.PrimaryKeyRelatedField(
        source='user',
        queryset=User.objects.all()
    )

    class Meta:
        model = StudiesEditionStaff
        exclude = ('studies_edition', 'id', 'user')

class StudiesEditionStaffReadSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = StudiesEditionStaff
        exclude = ('studies_edition', )

class StudiesDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudiesDocument
        exclude = ('studies_edition', )
        read_only = ('id', )

    @staticmethod
    def validate_due_date(value):
        if value < timezone.now():
            raise serializers.ValidationError({
                "due_date": "Must be in the future"
            })