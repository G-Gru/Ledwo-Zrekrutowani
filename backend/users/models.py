from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50, blank=True)
    created_date = models.DateTimeField(auto_now_add=True)
    is_employee = models.BooleanField(default=False)
    index_number = models.CharField(max_length=20, unique=True, null=True, blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def is_employee_user(self):
        return self.is_employee

    def is_student_user(self):
        return not self.is_employee

    def __str__(self):
        return self.email

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="employee", primary_key=True)
    academic_title = models.CharField(max_length=100, blank=True)
    office = models.CharField(max_length=100, blank=True)

class WorkPhoneNumber(models.Model):
    employee = models.ForeignKey(Employee, related_name="work_phones", on_delete=models.CASCADE)
    phone = models.CharField(max_length=50)