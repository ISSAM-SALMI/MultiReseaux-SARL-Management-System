from core.views import BaseViewSet
from .models import Invoice
from .serializers import InvoiceSerializer

class InvoiceViewSet(BaseViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    module_name = 'invoices'
