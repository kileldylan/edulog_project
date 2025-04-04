from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """
    Custom permission to allow only admin users to access the view.
    """
    def has_permission(self, request, view):
        return request.user.role == 'admin'
