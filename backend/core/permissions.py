from rest_framework import permissions
from authentication.models import UserRole, Permission

class RBACPermission(permissions.BasePermission):
    """
    Custom permission to check if user has permission for the module and action.
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        # Superuser and staff users have all permissions
        if request.user.is_superuser or request.user.is_staff:
            return True

        # Determine module from view (view should have 'module_name' attribute)
        module_name = getattr(view, 'module_name', None)
        if not module_name:
            return True # Or False if we want to be strict

        # Determine action
        action_map = {
            'list': 'can_read',
            'retrieve': 'can_read',
            'create': 'can_write',
            'update': 'can_update',
            'partial_update': 'can_update',
            'destroy': 'can_delete',
        }
        
        required_permission = action_map.get(view.action)
        if not required_permission:
            return True # Safe actions or custom actions without specific mapping

        # Check user roles
        user_roles = UserRole.objects.filter(user=request.user)
        for ur in user_roles:
            # Check if role has permission for this module
            try:
                perm = Permission.objects.get(role=ur.role, module=module_name)
                if getattr(perm, required_permission):
                    return True
            except Permission.DoesNotExist:
                continue
                
        return False
