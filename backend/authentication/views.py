from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from .models import User, Role, Permission
from .serializers import UserSerializer, RoleSerializer, PermissionSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_permissions(self):
        """
        Allow authenticated users to access 'me'.
        Require admin privileges for all other actions (CRUD on users).
        """
        if self.action == 'me':
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_queryset(self):
        # Only admins can see the full user list
        if self.request.user.is_staff or self.request.user.is_superuser:
            return User.objects.all()
        # Regular users can only see themselves (for internal safety, though permissions block list/retrieve)
        return User.objects.filter(id=self.request.user.id)

    @action(detail=False, methods=['get'], url_name='me')
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]
