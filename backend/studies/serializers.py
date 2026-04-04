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