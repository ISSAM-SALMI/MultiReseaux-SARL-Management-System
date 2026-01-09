from core.views import BaseViewSet
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(BaseViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    module_name = 'clients'
    pagination_class = None  # Disable pagination to allow client-side filtering of all records
