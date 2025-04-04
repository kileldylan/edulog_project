from django.contrib import admin
from django.urls import path,include
from rest_framework import routers
from edulog_app import views

router = routers.DefaultRouter()
router.register(r'attendance', views.AttendanceLogViewSet, basename='attendance')
router.register(r'admin/attendance', views.AttendanceViewSet, basename='admin-attendance')
router.register(r'departments', views.DepartmentViewSet, basename='department')

urlpatterns = [
    path('', include(router.urls)),
    path('admin/', admin.site.urls),  
    path('auth-users/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/login/', views.LoginUserView.as_view(), name="login"),
    path('api/register/', views.RegisterUserView.as_view(), name='register'),
    path('api/students/stats/department-wise/', views.DepartmentStatsView.as_view(), name='department-stats'),
    path('api/students/<int:student_id>/details/', views.StudentDetailView.as_view(), name='student-detail'),
    path('api/attendance/<int:student_id>/', views.AttendanceStatsView.as_view(), name='attendance-stats'),
    path('api/attendance/clock-in/', views.ClockInView.as_view(), name='clock-in'),
    path('api/attendance/clock-out/', views.ClockOutView.as_view(), name='clock-out'),
    path('api/attendance/stats/total-students/', views.TotalStudentsView.as_view(), name = 'total-students'),
    path('api/attendance/stats/attendance-today/', views.AttendanceTodayView.as_view(), name = 'attendance-today'),
    path('api/attendance/update/<int:pk>/', views.AttendanceUpdateView.as_view(), name = 'attendance-update'),
    path('api/attendance/stats/absent-students/', views.AbsentStudentsView.as_view(), name = 'absent-students'),
    path('api/attendance/stats/percentage/', views.AttendancePercentageView.as_view(), name = 'percentage'),
    path('api/attendance/reports/', views.StudentReportView.as_view(), name = 'student-reports'),
    path('api/attendance/reports/filters/', views.ReportFilterOptionsView.as_view(), name = 'student-reports-filters'),
    path('api/attendance/reports/students/', views.StudentSearchView.as_view(), name = 'student-reports'),
    path('api/attendance/<int:student_id>/status/', views.AttendanceStatusView.as_view(), name='attendance-status'),
    path('api/attendance/recent-logs/', views.RecentAttendanceLogsView.as_view(), name='recent-logs'),
    path('api/events/upcoming/', views.UpcomingEventsView.as_view(), name='upcoming-events'),
    path('api/attendance/records/', views.AttendanceRecordListCreateView.as_view(), name='attendance-records'),
    path('api/attendance/records/<int:pk>/', views.AttendanceRecordRetrieveUpdateView.as_view(), name='attendance-record-detail'),
    path('api/events/', views.EventListCreateView.as_view(), name='event-list'),
    path('api/events/<int:pk>/', views.EventRetrieveUpdateDestroyView.as_view(), name='event-detail'),
]   