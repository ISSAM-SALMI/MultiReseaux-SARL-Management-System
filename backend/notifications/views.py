from core.views import BaseViewSet
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(BaseViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    module_name = 'notifications'

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)
