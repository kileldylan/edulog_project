from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings
from django.utils import timezone

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("This email field is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin') 
        return self.create_user(email, password, **extra_fields)

class Department(models.Model):
    name = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('student', 'Student'),
    ]
    
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=50)
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True) # Only for students
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='student')
    student_profile = models.OneToOneField('Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='user')
    department = models.ForeignKey( Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
 
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = [] 

    def __str__(self):
        return self.email

    class Meta:
        db_table = 'edulog_app_customuser' 

class AttendanceLog(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=50, choices=[('login', 'Login'), ('logout', 'Logout')])

    def __str__(self):
        return f"{self.user.username if self.user else 'Unknown User'} - {self.action} at {self.timestamp}"
    
class Attendance(models.Model):
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('pending', 'Pending')  # for clock-in before clock-out
    ]
    
    user = models.ForeignKey(CustomUser, related_name='attendance_records', on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    clock_in_time = models.TimeField(null=True, blank=True)
    clock_out_time = models.TimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ('user', 'date')  # One record per user per day

class Student(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='students')

class SchoolEvent(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    date = models.DateField()
    location = models.CharField(max_length=200, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.title} - {self.date}"