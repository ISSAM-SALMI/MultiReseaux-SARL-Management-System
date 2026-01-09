from core.views import BaseViewSet
from .models import Document
from .serializers import DocumentSerializer

class DocumentViewSet(BaseViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    module_name = 'documents'
