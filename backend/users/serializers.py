from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(source='first_name')
    lastName = serializers.CharField(source='last_name')
    pesel = serializers.CharField(max_length=11)
    nationality = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    confirmPassword = serializers.CharField(write_only=True, required=False) # walidowane głownie na froncie
    
    consents = serializers.DictField(child=serializers.BooleanField())

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Użytkownik z tym adresem email już istnieje.")
        return value

    def validate(self, data):
        consents = data.get('consents', {})
        if not consents.get('infoClause') or not consents.get('gdpr'):
            raise serializers.ValidationError("Wymagane zgody (infoClause, gdpr) nie zostały zaznaczone.")
        
        if 'confirmPassword' in data and data['password'] != data['confirmPassword']:
            raise serializers.ValidationError("Hasła nie są identyczne.")
            
        return data

    def create(self, validated_data):
        # gdzie pesel, nationality i consents??
        user = User.objects.create_user(
            username=validated_data['email'], 
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data['phone'],
            role='STUDENT'
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(request=self.context.get('request'), email=email, password=password)
            if not user:
                raise serializers.ValidationError("Niepoprawne dane logowania.")
        else:
            raise serializers.ValidationError("Musisz podać email oraz hasło.")
        
        data['user'] = user
        return data