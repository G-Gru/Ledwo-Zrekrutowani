from rest_framework import serializers

from studies.models import Studies, StudiesEdition, StudiesEditionStaff
from users.models import User


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

    class Meta:
        model = StudiesEdition
        exclude = ('studies', )

class StudiesEditionListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='studies.name')

    class Meta:
        model = StudiesEdition
        fields = ('id', 'name', 'price', 'start_date', 'status')

class StudiesEditionDetailsSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='studies.name')
    terms_count = serializers.IntegerField(source='studies.terms_count')
    description = serializers.CharField(source='studies.description')

    class Meta:
        model = StudiesEdition
        exclude = ('studies', )


class StudiesEditionStaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudiesEditionStaff
        exclude = ('studies_edition', 'id')