from sqlite3 import IntegrityError
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, generics
from .models import AttendanceLog, CustomUser, Department, Attendance, SchoolEvent
from .serializers import AttendanceLogSerializer, CustomUserSerializer, DepartmentStatsSerializer, AttendancePercentageSerializer, AdminAttendanceSerializer, DepartmentSerializer, AttendanceSerializer, SchoolEventSerializer
from .permissions import IsAdmin
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from django.utils import timezone
from django.db.models import Count, Q, F, ExpressionWrapper, FloatField, Case, When, Value, Max
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken
from datetime import datetime, date, timedelta
from rest_framework.permissions import BasePermission

import logging
logger = logging.getLogger(__name__)

class LoginUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = authenticate(email=email, password=password)

        if user is not None:
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "role": user.role,
                "message": "Login successful!",
            }

            # Adding student-specific data only for students
            if user.role == 'student':
                response_data.update({
                    "student_id": user.student_id,
                    "student_name": user.username
                })

            return Response(response_data, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials! Please try again."}, status=status.HTTP_401_UNAUTHORIZED)
        
class RegisterUserView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info("Registration request data: %s", request.data) 
        serializer = CustomUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "User registered"}, status=status.HTTP_201_CREATED)
        else:
            logger.error("Registration validation errors: %s", serializer.errors)  # Log validation errors
            return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdmin]

class AttendanceRecordListCreateView(generics.ListCreateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        return super().get_queryset().order_by('-date')

class AttendanceRecordRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def perform_update(self, serializer):
        serializer.save(updated_at=timezone.now())

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().select_related('user') 
    serializer_class = AdminAttendanceSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        # Filter only student records (non-admin users)
        queryset = super().get_queryset().filter(
            Q(user__role='student') | Q(user__is_staff=False) | Q(user__is_superuser=False)
        )
        
        date_from = self.request.query_params.get('from_date')
        date_to = self.request.query_params.get('to_date')
        
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
            
        return queryset.order_by('-date')  # Newest first
    
class AttendanceStatsView(APIView):
    def get(self, request, student_id):
        try:
            # Get student by ID or student_id
            student = CustomUser.objects.filter(
                Q(id=student_id) | Q(student_id=student_id)
            ).first()
            
            if not student:
                return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

            # Get counts for all status types
            counts = Attendance.objects.filter(user=student).aggregate(
                total=Count('id'),
                present=Count('id', filter=Q(status='present')),
                absent=Count('id', filter=Q(status='absent')),
                late=Count('id', filter=Q(status='late'))
            )
            
            return Response({
                "total": counts['total'],
                "present": counts['present'],
                "absent": counts['absent'],
                "late": counts['late'],
                "percentage": (counts['present'] / counts['total'] * 100) if counts['total'] > 0 else 0
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class AttendanceLogViewSet(viewsets.ModelViewSet):
    """API endpoint to manage attendance logs"""
    queryset = AttendanceLog.objects.all()
    serializer_class = AttendanceLogSerializer
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def login_log(self, request):
        """Log student login"""
        AttendanceLog.objects.create(user=request.user, action="login")
        return Response({"message": "Login recorded."}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def logout_log(self, request):
        """Log student logout"""
        AttendanceLog.objects.create(user=request.user, action="logout")
        return Response({"message": "Logout recorded."}, status=status.HTTP_201_CREATED)

class AttendanceUpdateView(APIView):
    permission_classes = [IsAdmin]
    
    def put(self, request, pk):
        try:
            attendance_record = Attendance.objects.get(id=pk)
            
            # Create a copy of request data without read-only fields
            update_data = request.data.copy()
            update_data.pop('student_id', None)
            update_data.pop('student_name', None)
            
            serializer = AdminAttendanceSerializer(
                attendance_record,
                data=update_data,
                partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
                
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Attendance.DoesNotExist:
            return Response({"error": "Attendance record not found"}, status=status.HTTP_404_NOT_FOUND)
            
class StudentDetailView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, student_id):
        try:
            student = CustomUser.objects.get(id=student_id)
            serializer = CustomUserSerializer(student)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

class ClockInView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student = request.user
        now = timezone.now()
        today = now.date()
        
        # Create or update attendance record
        attendance, created = Attendance.objects.update_or_create(
            user=student,
            date=today,
            defaults={
                'clock_in_time': now.time(),
                'status': 'present'
            }
        )
        
        # Calculate the updated present count
        present_count = Attendance.objects.filter(user=student, status='present').count()
        
        return Response({
            "message": "Clocked in successfully",
            "is_clocked_in": True,
            "clock_in_time": now.time().strftime("%H:%M:%S"),
            "updated_present_count": present_count  # Added field
        }, status=status.HTTP_201_CREATED)

class ClockOutView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student = request.user
        now = timezone.now()
        today = now.date()
        
        # Get today's attendance record
        attendance = Attendance.objects.filter(
            user=student,
            date=today
        ).first()

        if not attendance:
            return Response(
                {"error": "No attendance record found for today"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Update the attendance record
        attendance.clock_out_time = now.time()
        attendance.status = 'present'  # Ensure status is marked present
        attendance.save()
        
        return Response(
            {
                "message": "Clocked out successfully",
                "clock_out_time": now.time().strftime("%H:%M:%S")
            },
            status=status.HTTP_200_OK
        )
    
class TotalStudentsView(APIView):
    def get(self, request):
        total_students = CustomUser.objects.filter(role='student').count()
        return Response({"total": total_students}, status=status.HTTP_200_OK)

class AttendanceStatusView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):  
        try:
            # Get the student (either by ID or student_id)
            student = CustomUser.objects.filter(Q(id=student_id) | Q(student_id=student_id)).first()
            
            if not student:
                return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
                
            today = timezone.now().date()
            
            # Check if clocked in today and not yet clocked out
            is_clocked_in = Attendance.objects.filter(
                user=student,
                date=today,
                clock_in_time__isnull=False,
                clock_out_time__isnull=True
            ).exists()
            
            return Response({
                "is_clocked_in": is_clocked_in
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
class AttendanceTodayView(APIView):
    def get(self, request):
        today = timezone.now().date()
        total_students = CustomUser.objects.filter(role='student').count()
        present_students = Attendance.objects.filter(date=today, status='present').count()
        attendance_percentage = (present_students / total_students) * 100 if total_students > 0 else 0
        return Response({"attendancePercentage": attendance_percentage}, status=status.HTTP_200_OK)

class AbsentStudentsView(APIView):
    def get(self, request):
        today = timezone.now().date()
        absent_students = Attendance.objects.filter(date=today, status='absent').count()
        return Response({"absentCount": absent_students}, status=status.HTTP_200_OK)

class AttendancePercentageView(APIView):
    def get(self, request):
        attendance_data = CustomUser.objects.filter(role='student').annotate(
            total_attendance=Count('attendance_records'),
            present_attendance=Count('attendance_records', filter=Q(attendance_records__status='present')),
        ).annotate(
            attendance_percentage=Case(
                When(total_attendance=0, then=Value(0.0)),
                default=ExpressionWrapper(
                    F('present_attendance') * 100.0 / F('total_attendance'),
                    output_field=FloatField()
                ),
                output_field=FloatField()
            )
        ).values('id', 'username', 'attendance_percentage')

        serializer = AttendancePercentageSerializer(attendance_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DepartmentStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        department_stats = Department.objects.annotate(
            student_count=Count('students')
        ).values('name', 'student_count')
        serializer = DepartmentStatsSerializer(department_stats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StudentReportView(APIView):
    def get(self, request):
        # Extract filters from query parameters
        start_date = request.query_params.get('startDate')
        end_date = request.query_params.get('endDate')
        status_filter = request.query_params.get('statusFilter')
        department_filter = request.query_params.get('departmentFilter')
        student_name_filter = request.query_params.get('studentNameFilter')

        # Build filters for attendance records
        attendance_filters = Q()
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            attendance_filters &= Q(attendance_records__date__range=[start_date, end_date])
        if status_filter:
            attendance_filters &= Q(attendance_records__status=status_filter)
        if student_name_filter:
            attendance_filters &= Q(username__icontains=student_name_filter)

        # Fetch and annotate data
        report_data = CustomUser.objects.filter(
            role='student',
            **({'department__name': department_filter} if department_filter else {})
        ).annotate(
            total_attendance=Count('attendance_records', filter=attendance_filters),
            present_attendance=Count('attendance_records', 
                                   filter=attendance_filters & Q(attendance_records__status='present')),
            absent_attendance=Count('attendance_records', 
                                  filter=attendance_filters & Q(attendance_records__status='absent')),
            latest_attendance_date=Max('attendance_records__date', filter=attendance_filters),
        ).annotate(
            attendance_percentage=Case(
                When(total_attendance=0, then=Value(0.0)),
                default=ExpressionWrapper(
                    F('present_attendance') * 100.0 / F('total_attendance'),
                    output_field=FloatField()
                ),
                output_field=FloatField()
            )
        ).values(
            'id', 'username', 'student_id', 'department__name',
            'total_attendance', 'present_attendance', 'absent_attendance',
            'attendance_percentage', 'latest_attendance_date'
        )

        # Format data for the frontend
        formatted_data = []
        for record in report_data:
            formatted_data.append({
                'attendanceDate': record['latest_attendance_date'] if record['latest_attendance_date'] else 'N/A',
                'studentName': record['username'],
                'status': 'present' if record['present_attendance'] > 0 else 'absent',
                'department': record['department__name'] if record['department__name'] else 'N/A',
                'attendancePercentage': record['attendance_percentage'],
            })

        return Response(formatted_data, status=status.HTTP_200_OK)

class ReportFilterOptionsView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        # Get all available filter options
        departments = Department.objects.values_list('name', flat=True).distinct()
        status_choices = [choice[0] for choice in Attendance.STATUS_CHOICES]
        
        return Response({
            'departments': list(departments),
            'status_choices': status_choices
        })

class StudentSearchView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        search_query = request.query_params.get('q', '')
        
        students = CustomUser.objects.filter(
            Q(role='student') & 
            (Q(username__icontains=search_query) | 
             Q(student_id__icontains=search_query))
        ).values('id', 'username', 'student_id')[:10]  # Limit to 10 results
        
        return Response(students)

class RecentAttendanceLogsView(APIView):
    permission_classes = [IsAdmin]
    
    def get(self, request):
        logs = Attendance.objects.select_related('user').order_by('-date', '-id')[:10]
        data = [{
            'student_name': log.user.username,
            'student_id': log.user.student_id,
            'date': log.date.strftime('%Y-%m-%d'),
            'status': log.status
        } for log in logs]
        return Response(data)

class UpcomingEventsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today = timezone.now().date()
        events = SchoolEvent.objects.filter(date__gte=today).order_by('date')[:5]
        data = [{
            'title': event.title,
            'date': event.date.strftime('%Y-%m-%d'),
            'location': event.location,
            'description': event.description
        } for event in events]
        return Response(data)
    
class EventListCreateView(generics.ListCreateAPIView):
    queryset = SchoolEvent.objects.all().order_by('-date')
    serializer_class = SchoolEventSerializer

class EventRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SchoolEvent.objects.all()
    serializer_class = SchoolEventSerializer