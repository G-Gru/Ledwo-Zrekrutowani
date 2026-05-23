from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, WorkPhoneNumber


class UserSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'phone', 'type')

    def get_type(self, obj):
        if obj.is_staff:
            return "ADMIN"
        if obj.is_employee:
            return "EMPLOYEE"
        return "STUDENT"

class WorkPhoneNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkPhoneNumber
        fields = ('id', 'phone', )
        read_only_fields = ('id',)

class EmployeeSerializer(serializers.ModelSerializer):
    academic_title = serializers.CharField(source='employee.academic_title', read_only=True)
    work_phones = WorkPhoneNumberSerializer(source='employee.work_phones', many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'academic_title', 'work_phones')

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        error_messages={
            "invalid": "Podaj poprawny adres email.",
            "blank": "Pole email jest wymagane.",
            "required": "Pole email jest wymagane."
        }
    )
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'phone')

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Istnieje już użytkownik z tym adresem email.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True, error_messages={"blank": "Pole wymagane."})
    new_password = serializers.CharField(write_only=True, error_messages={"blank": "Pole wymagane."})


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages={"invalid": "Niepoprawny format email.", "blank": "Pole email jest wymagane."})
    password = serializers.CharField(write_only=True, error_messages={"blank": "Hasło jest wymagane."})

    def validate_email(self, value):
        return value.lower()

    def validate(self, data):
        user = authenticate(
            username=data["email"],
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError("Niepoprawne dane logowania.")
        if not user.is_active:
            raise serializers.ValidationError("To konto jest nieaktywne.")

        data["user"] = user
        return data