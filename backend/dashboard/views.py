from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from projects.models import Project
from quotes.models import Quote
from invoices.models import Invoice
from suppliers.models import SupplierInvoice
from budget.models import GeneralExpense, MonthlyLabourCost
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Basic KPIs
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(etat_projet='EN_COURS').count()
        
        total_quotes_amount = Quote.objects.aggregate(Sum('total_ttc'))['total_ttc__sum'] or 0
        total_invoices_amount = Invoice.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        
        # === CALCUL DE LA MARGE BRUTE (GROSS MARGIN) ===
        # Gross Margin = Projects in Progress + Unbilled Projects + Billed Projects + Project Advances
        
        # Get all projects by billing status
        from projects.models import Revenue
        
        billed_projects = Project.objects.filter(billing_status='FACTURE').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
        unbilled_projects = Project.objects.filter(billing_status='NON_FACTURE').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
        in_progress_projects = Project.objects.filter(billing_status='EN_COURS').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
        
        # Project advances (Avances de projet)
        project_advances = Revenue.objects.aggregate(Sum('avance'))['avance__sum'] or 0
        
        # Gross Margin calculation
        gross_margin = Decimal(billed_projects) + Decimal(unbilled_projects) + Decimal(in_progress_projects) + Decimal(project_advances)
        
        # === CALCUL DES DÉPENSES TOTALES (TOTAL EXPENSES) ===
        # Total Expenses = Labour costs + Supplies + Operating expenses
        
        # 1. Supplies (Fournitures) - Achats Fournisseurs
        suppliers_expenses = SupplierInvoice.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 2. Labour costs (Main d'œuvre) - coûts manuels uniquement
        labour_expenses = MonthlyLabourCost.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 3. Operating expenses (Charges) - Autres Dépenses (GeneralExpense)
        general_expenses = GeneralExpense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Total des dépenses
        total_expenses = Decimal(suppliers_expenses) + Decimal(labour_expenses) + Decimal(general_expenses)
        
        # === CALCUL DE LA MARGE NETTE (NET MARGIN) ===
        # Net Margin = Gross Margin - Total Expenses
        net_margin = gross_margin - total_expenses
        
        # Total revenue (for backward compatibility with existing charts)
        total_revenue = Decimal(total_invoices_amount)
        
        # Taux de marge (en %)
        margin_percentage = (net_margin / gross_margin * 100) if gross_margin > 0 else 0
        
        # Recent Activity
        recent_projects = Project.objects.order_by('-date_debut')[:5].values('id_project', 'nom_projet', 'etat_projet', 'date_debut')
        recent_quotes = Quote.objects.order_by('-id_quote')[:5].values('id_quote', 'numero_devis', 'total_ttc', 'date_livraison')

        # Monthly Evolution (Last 6 months)
        monthly_evolution = []
        today = timezone.now().date()
        months_list = []
        
        # Generate last 6 months keys (Current + 5 past)
        curr = today.replace(day=1)
        for _ in range(6):
            months_list.append((curr.year, curr.month))
            # Calculate prev month
            if curr.month == 1:
                curr = curr.replace(year=curr.year-1, month=12)
            else:
                curr = curr.replace(month=curr.month-1)
        months_list.reverse()

        for year, month in months_list:
            # Calculate project values for this month
            import calendar
            _, last_day = calendar.monthrange(year, month)
            start_date = timezone.datetime(year, month, 1).date()
            end_date = timezone.datetime(year, month, last_day).date()
            
            # Projects active in this period
            from projects.models import Revenue
            projects_in_period = Project.objects.filter(
                date_debut__lte=end_date
            ).filter(
                Q(date_fin__gte=start_date) | Q(date_fin__isnull=True)
            )
            
            # Calculate gross margin for the month
            monthly_billed = projects_in_period.filter(billing_status='FACTURE').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
            monthly_unbilled = projects_in_period.filter(billing_status='NON_FACTURE').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
            monthly_in_progress = projects_in_period.filter(billing_status='EN_COURS').aggregate(Sum('budget_total'))['budget_total__sum'] or 0
            
            # Project advances for projects in this period
            monthly_advances = Revenue.objects.filter(
                project__in=projects_in_period
            ).aggregate(Sum('avance'))['avance__sum'] or 0
            
            # Monthly Gross Margin
            monthly_gross_margin = Decimal(monthly_billed) + Decimal(monthly_unbilled) + Decimal(monthly_in_progress) + Decimal(monthly_advances)

            # Quotes statistics (Devis Signés/Livrés)
            monthly_quotes_amount = Quote.objects.filter(
                date_livraison__year=year,
                date_livraison__month=month
            ).aggregate(Sum('total_ttc'))['total_ttc__sum'] or 0
            
            quotes_count = Quote.objects.filter(
                date_livraison__year=year,
                date_livraison__month=month
            ).count()

            # Monthly Expenses
            ms = SupplierInvoice.objects.filter(date__year=year, date__month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            ml = MonthlyLabourCost.objects.filter(year=year, month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            mg = GeneralExpense.objects.filter(date__year=year, date__month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            
            monthly_total_expenses = Decimal(ms) + Decimal(ml) + Decimal(mg)
            
            # Monthly Net Margin = Gross Margin - Total Expenses
            monthly_net_margin = monthly_gross_margin - monthly_total_expenses
            
            # Format YYYY-MM
            month_str = f"{year}-{month:02d}"

            monthly_evolution.append({
                'month': month_str,
                'quotes_count': quotes_count,
                'quotes_amount': float(monthly_quotes_amount),
                'revenue': float(monthly_gross_margin), # Gross margin for display (replaces simple revenue)
                'expenses': float(monthly_total_expenses),
                'margin': float(monthly_net_margin), # Net margin
                'suppliers_expenses': float(ms),
                'labour_expenses': float(ml),
                'general_expenses': float(mg)
            })

        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'total_quotes_amount': float(total_quotes_amount),
            'total_invoices_amount': float(total_invoices_amount),
            # Financial data
            'total_revenue': float(total_revenue), # Kept for backward compatibility
            'gross_margin': float(gross_margin), # NEW: Marge Brute
            'total_expenses': float(total_expenses),
            'profit_margin': float(net_margin), # NET MARGIN (renamed from profit_margin)
            'net_margin': float(net_margin), # Also provided as net_margin for clarity
            'margin_percentage': float(margin_percentage),
            # Breakdown
            'project_breakdown': {
                'billed': float(billed_projects),
                'unbilled': float(unbilled_projects),
                'in_progress': float(in_progress_projects),
                'advances': float(project_advances)
            },
            'expenses_breakdown': {
                'suppliers': float(suppliers_expenses),
                'labour': float(labour_expenses),
                'general': float(general_expenses)
            },
            'recent_projects': recent_projects,
            'recent_quotes': recent_quotes,
            'monthly_evolution': monthly_evolution
        })
