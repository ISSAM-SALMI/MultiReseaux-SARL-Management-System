from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.views import BaseViewSet
from .models import EstimationRow
from .serializers import EstimationRowSerializer

class EstimationRowViewSet(BaseViewSet):
    queryset = EstimationRow.objects.all()
    serializer_class = EstimationRowSerializer
    module_name = 'hr_estimation'
    pagination_class = None # No pagination for this table

    @action(detail=False, methods=['post'])
    def bulk_update_rows(self, request):
        # Delete all existing rows and replace with new ones
        # This is a simple approach for a "Save" button that captures the whole table state
        EstimationRow.objects.all().delete()
        
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save() # Direct save to avoid AuditLogMixin issue with lists
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        EstimationRow.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

