from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supplier, SupplierInvoice
from .serializers import SupplierSerializer, SupplierInvoiceSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
import datetime

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'ice', 'phone', 'email', 'category']
    ordering_fields = ['name', 'created_at']

class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.all()
    serializer_class = SupplierInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['supplier__name', 'reference', 'description']
    ordering_fields = ['date', 'amount']

    @action(detail=False, methods=['get'], url_path='monthly-stats')
    def monthly_stats(self, request):
        today = datetime.date.today()
        current_year = today.year
        current_month = today.month
        
        # Monthly total
        monthly_total = self.queryset.filter(
            date__year=current_year, 
            date__month=current_month
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        # Yearly total
        yearly_total = self.queryset.filter(
            date__year=current_year
        ).aggregate(Sum('amount'))['amount__sum'] or 0

        return Response({
            'monthly_total': monthly_total,
            'yearly_total': yearly_total
        })
