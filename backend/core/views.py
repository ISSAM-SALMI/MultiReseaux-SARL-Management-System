from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import RBACPermission
from .mixins import AuditLogMixin

class BaseViewSet(AuditLogMixin, viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, RBACPermission]
    # Subclasses must define module_name
