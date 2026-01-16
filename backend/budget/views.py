from core.views import BaseViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from .models import Employee, Material, MaterialCost, GeneralExpense
from .serializers import EmployeeSerializer, MaterialSerializer, MaterialCostSerializer, GeneralExpenseSerializer

# Import external models for aggregation
from suppliers.models import SupplierInvoice
# Payroll might be imported differently depending on app structure check
try:
    from payroll.models import SalaryPeriod
except ImportError:
    SalaryPeriod = None

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

class GeneralExpenseViewSet(BaseViewSet):
    queryset = GeneralExpense.objects.all()
    serializer_class = GeneralExpenseSerializer
    module_name = 'budget'

    def get_queryset(self):
        queryset = super().get_queryset()
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')
        if year and month:
            queryset = queryset.filter(date__year=year, date__month=month)
        return queryset

    @action(detail=False, methods=['get'], url_path='monthly-dashboard')
    def monthly_dashboard(self, request):
        import datetime
        
        # Get params or default to current month
        today = datetime.date.today()
        try:
            year = int(request.query_params.get('year', today.year))
            month = int(request.query_params.get('month', today.month))
        except ValueError:
            year = today.year
            month = today.month

        # 1. Suppliers Expenses
        suppliers_total = SupplierInvoice.objects.filter(
            date__year=year, 
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0

        # 2. Labor Expenses (Main-d'oeuvre) - Calculated from Project Duration & Workers
        try:
            from projects.models import Project
            import calendar

            # Determine month range
            _, last_day = calendar.monthrange(year, month)
            start_date = datetime.date(year, month, 1)
            end_date = datetime.date(year, month, last_day)

            # Find projects active in this month
            projects_in_period = Project.objects.filter(
                date_debut__lte=end_date,
                date_fin__gte=start_date
            ).prefetch_related('workers')

            labor_total = 0
            labor_breakdown = []

            for project in projects_in_period:
                # Calculate overlap duration
                p_start = max(project.date_debut, start_date)
                p_end = min(project.date_fin, end_date)
                duration = (p_end - p_start).days + 1
                
                if duration > 0:
                    # Sum daily salaries of all workers in this project
                    project_daily_cost = project.workers.aggregate(total=Sum('daily_salary'))['total'] or 0
                    project_month_cost = project_daily_cost * duration
                    
                    labor_total += project_month_cost
                    
                    labor_breakdown.append({
                        'project': project.nom_projet,
                        'duration_days': duration,
                        'workers_count': project.workers.count(),
                        'daily_run_rate': project_daily_cost,
                        'total_cost': project_month_cost
                    })

        except ImportError:
             # Fallback
            labor_total = 0
            labor_breakdown = []
            if SalaryPeriod:
                labor_total = SalaryPeriod.objects.filter(
                    start_date__year=year,
                    start_date__month=month
                ).aggregate(total=Sum('real_salary'))['total'] or 0

        # 3. Other Expenses (GeneralExpense)
        general_total_qs = self.queryset.filter(
            date__year=year,
            date__month=month
        )
        general_total = general_total_qs.aggregate(total=Sum('amount'))['total'] or 0
        
        # Breakdown by category for charts
        breakdown = general_total_qs.values('category').annotate(total=Sum('amount'))

        return Response({
            'period': {'month': month, 'year': year},
            'summary': {
                'suppliers_total': suppliers_total,
                'labor_total': labor_total,
                'general_options_total': general_total,
                'grand_total': suppliers_total + labor_total + general_total
            },
            'labor_breakdown': labor_breakdown,
            'general_expenses_breakdown': breakdown
        })
