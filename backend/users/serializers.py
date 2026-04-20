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
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'password', 'phone')

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(
            username=data["email"],
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        data["user"] = user
        return data