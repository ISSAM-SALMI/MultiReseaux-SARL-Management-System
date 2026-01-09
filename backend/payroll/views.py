from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SalaryPeriod, Leave
from .serializers import SalaryPeriodSerializer, LeaveSerializer

class SalaryPeriodViewSet(viewsets.ModelViewSet):
    queryset = SalaryPeriod.objects.all()
    serializer_class = SalaryPeriodSerializer
    
    def perform_create(self, serializer):
        serializer.save()

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Leave.objects.all()
    serializer_class = LeaveSerializer
