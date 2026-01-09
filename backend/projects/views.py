from core.views import BaseViewSet
from .models import Project, ProjectHR, ProjectCost, Revenue, Expense, ProjectWorker, ProjectWorkerAttendance
from .serializers import ProjectSerializer, ProjectHRSerializer, ProjectCostSerializer, RevenueSerializer, ExpenseSerializer, ProjectWorkerSerializer, ProjectWorkerAttendanceSerializer

class ProjectViewSet(BaseViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    module_name = 'projects'

class ProjectWorkerAttendanceViewSet(BaseViewSet):
    queryset = ProjectWorkerAttendance.objects.all()
    serializer_class = ProjectWorkerAttendanceSerializer
    module_name = 'projects'
    filterset_fields = ['worker']

class ProjectWorkerViewSet(BaseViewSet):
    queryset = ProjectWorker.objects.all()
    serializer_class = ProjectWorkerSerializer
    module_name = 'projects'
    filterset_fields = ['project', 'employee']

class ProjectHRViewSet(BaseViewSet):
    queryset = ProjectHR.objects.all()
    serializer_class = ProjectHRSerializer
    module_name = 'projects'

class ProjectCostViewSet(BaseViewSet):
    queryset = ProjectCost.objects.all()
    serializer_class = ProjectCostSerializer
    module_name = 'projects'

class RevenueViewSet(BaseViewSet):
    queryset = Revenue.objects.all()
    serializer_class = RevenueSerializer
    module_name = 'projects'

class ExpenseViewSet(BaseViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    module_name = 'projects'

