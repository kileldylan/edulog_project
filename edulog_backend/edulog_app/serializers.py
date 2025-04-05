from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AttendanceLog, CustomUser, Attendance, Department, SchoolEvent

class AttendanceLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceLog
        fields = ["id", "user", "timestamp", "action"]

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["email", "username", "password", "role", "student_id", "department"]
        extra_kwargs = {
            'password': {'write_only': True},
            'student_id': {'required': False, 'allow_blank': True},
        }

    def create(self, validated_data):
        # Extract password first
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)  # This properly hashes the password
        user.save()
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data:
            instance.set_password(validated_data['password'])
        return super().update(instance, validated_data)
    
class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']

class AdminAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='user.username', read_only=True)
    student_id = serializers.CharField(source='user.student_id', read_only=True)
    
    class Meta:
        model = Attendance
        fields = [
            'id',
            'student_id',
            'student_name',
            'date',
            'status',
            'clock_in_time',
            'clock_out_time',
            'user' 
        ]
        read_only_fields = [
            'created_at',
            'updated_at',
            'student_id',
            'student_name',
            'id'
        ]
    
    def validate(self, data):
        """
        Ensure the user field cannot be modified if present
        """
        if 'user' in data and self.instance and data['user'] != self.instance.user:
            raise serializers.ValidationError("Cannot change user for an attendance record")
        return data
    
class AttendanceSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source='user.id', read_only=True)  # Add student_id
    student_name = serializers.CharField(source='user.username', read_only=True)  # Add student_name
    clockInTime = serializers.TimeField(source='clock_in_time', read_only=True)  # Map clock_in_time to clockInTime
    clockOutTime = serializers.TimeField(source='clock_out_time', read_only=True)  # Map clock_out_time to clockOutTime

    class Meta:
        model = Attendance
        fields = ['id', 'student_id', 'student_name', 'date', 'status', 'clockInTime', 'clockOutTime']
    
class AttendanceStatsSerializer(serializers.Serializer):
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    late = serializers.IntegerField()

class DepartmentStatsSerializer(serializers.Serializer):
    name = serializers.CharField()
    student_count = serializers.IntegerField()

class AttendancePercentageSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    attendance_percentage = serializers.FloatField()

class SchoolEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolEvent
        fields = ['id', 'title', 'description', 'date', 'location', 'created_at']
        read_only_fields = ['created_at', 'id']
