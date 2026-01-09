from core.views import BaseViewSet
from .models import Employee, Material, MaterialCost
from .serializers import EmployeeSerializer, MaterialSerializer, MaterialCostSerializer

class EmployeeViewSet(BaseViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    module_name = 'budget'

class MaterialViewSet(BaseViewSet):
    queryset = Material.objects.all()
    serializer_class = MaterialSerializer
    module_name = 'budget'

class MaterialCostViewSet(BaseViewSet):
    queryset = MaterialCost.objects.all()
    serializer_class = MaterialCostSerializer
    module_name = 'budget'
