from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Attendance, AttendanceLog, Department, Student, SchoolEvent

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'username', 'role', 'is_staff', 'is_active')
    search_fields = ('email', 'username')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('username', 'role', 'student_id')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'role', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(Attendance)
admin.site.register(AttendanceLog)
admin.site.register(Department)
admin.site.register(Student)
admin.site.register(SchoolEvent)

