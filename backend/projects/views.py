from core.views import BaseViewSet
from .models import Project, ProjectHR, ProjectCost, Revenue, Expense
from .serializers import ProjectSerializer, ProjectHRSerializer, ProjectCostSerializer, RevenueSerializer, ExpenseSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
import datetime

class ProjectViewSet(BaseViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    module_name = 'projects'
    pagination_class = None

    @action(detail=False, methods=['get'])
    def financial_overview(self, request):
        today = datetime.date.today()
        try:
            year = int(request.query_params.get('year', today.year))
            month = int(request.query_params.get('month', today.month))
        except ValueError:
            year = today.year
            month = today.month
            
        # Determine period dates
        import calendar
        _, last_day = calendar.monthrange(year, month)
        start_date = datetime.date(year, month, 1)
        end_date = datetime.date(year, month, last_day)

        # 1. Revenue (Projects active in period)
        # Assuming we want to see ALL projects revenue if they overlap with the period
        projects_in_period = self.queryset.filter(
            date_debut__lte=end_date
        ).filter(
            Q(date_fin__gte=start_date) | Q(date_fin__isnull=True)
        )
        
        revenue_stats = projects_in_period.values('billing_status').annotate(total=Sum('budget_total'))
        
        billed = 0
        unbilled = 0
        in_progress = 0
        
        for item in revenue_stats:
            if item['billing_status'] == 'FACTURE':
                billed = item['total'] or 0
            elif item['billing_status'] == 'NON_FACTURE':
                unbilled = item['total'] or 0
            elif item['billing_status'] == 'EN_COURS':
                in_progress = item['total'] or 0
        
        # Project Advances (Avances de projet) - Sum all advances from Revenue model
        project_advances = Revenue.objects.filter(
            project__in=projects_in_period
        ).aggregate(total=Sum('avance'))['total'] or 0
        
        # Gross Margin = Projects in Progress + Unbilled Projects + Billed Projects (without advances)
        gross_margin = billed + unbilled + in_progress
        
        # Gross Margin with Advance = Gross Margin - Project Advances
        gross_margin_with_advance = gross_margin - project_advances
        
        # 2. Total Expenses (Dépenses Totales) = Labour + Supplies + Operating expenses
        from suppliers.models import SupplierInvoice
        from budget.models import GeneralExpense, MonthlyLabourCost
        
        # Supplies (Fournitures) - Supplier invoices
        suppliers_total = SupplierInvoice.objects.filter(
            date__year=year, 
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Labor costs (Main d'œuvre) - From manual monthly labor cost entries
        labor_total = MonthlyLabourCost.objects.filter(
            year=year,
            month=month
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Operating expenses (Charges) - General expenses
        general_total = GeneralExpense.objects.filter(
            date__year=year,
            date__month=month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Total Expenses = Labour + Supplies + Operating expenses
        total_expenses = suppliers_total + labor_total + general_total
        
        # Net Margin = Gross Margin with Advance - Total Expenses
        net_margin = gross_margin_with_advance - total_expenses
        
        return Response({
            'period': {'month': month, 'year': year},
            'revenue': {
                'billed': billed,
                'unbilled': unbilled,
                'in_progress': in_progress,
                'project_advances': project_advances,
                'gross_margin': gross_margin
            },
            'expenses': {
                'total': total_expenses,
                'breakdown': {
                    'suppliers': suppliers_total,
                    'labor': labor_total,
                    'other': general_total
                }
            },
            'net_margin': net_margin
        })

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

