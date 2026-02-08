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
        
        # === CALCUL DES DÉPENSES TOTALES ===
        # 1. Achats Fournisseurs
        suppliers_expenses = SupplierInvoice.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 2. Main-d'œuvre (coûts manuels uniquement)
        labour_expenses = MonthlyLabourCost.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # 3. Autres Dépenses (GeneralExpense)
        general_expenses = GeneralExpense.objects.aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Total des dépenses
        total_expenses = Decimal(suppliers_expenses) + Decimal(labour_expenses) + Decimal(general_expenses)
        
        # === CALCUL DU REVENU ET DE LA MARGE ===
        # Revenu = Total facturé
        total_revenue = Decimal(total_invoices_amount)
        
        # Marge brute = Revenu - Dépenses totales
        profit_margin = total_revenue - total_expenses
        
        # Taux de marge (en %)
        margin_percentage = (profit_margin / total_revenue * 100) if total_revenue > 0 else 0
        
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
            # Revenue from Invoices (Facturé) to be consistent with Global stats
            monthly_revenue = Invoice.objects.filter(
                date__year=year, 
                date__month=month
            ).aggregate(Sum('montant'))['montant__sum'] or 0

            # Quotes statistics (Devis Signés/Livrés)
            monthly_quotes_amount = Quote.objects.filter(
                date_livraison__year=year,
                date_livraison__month=month
            ).aggregate(Sum('total_ttc'))['total_ttc__sum'] or 0
            
            quotes_count = Quote.objects.filter(
                date_livraison__year=year,
                date_livraison__month=month
            ).count()

            # Expenses
            ms = SupplierInvoice.objects.filter(date__year=year, date__month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            ml = MonthlyLabourCost.objects.filter(year=year, month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            mg = GeneralExpense.objects.filter(date__year=year, date__month=month).aggregate(Sum('amount'))['amount__sum'] or 0
            
            monthly_total_expenses = Decimal(ms) + Decimal(ml) + Decimal(mg)
            monthly_rev_decimal = Decimal(monthly_revenue)
            monthly_margin = monthly_rev_decimal - monthly_total_expenses
            
            # Format YYYY-MM
            month_str = f"{year}-{month:02d}"

            monthly_evolution.append({
                'month': month_str,
                'quotes_count': quotes_count,
                'quotes_amount': float(monthly_quotes_amount),
                'revenue': float(monthly_revenue), # Key expected by frontend
                'expenses': float(monthly_total_expenses),
                'margin': float(monthly_margin),
                'suppliers_expenses': float(ms),
                'labour_expenses': float(ml),
                'general_expenses': float(mg)
            })

        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'total_quotes_amount': float(total_quotes_amount),
            'total_invoices_amount': float(total_invoices_amount),
            # Nouvelles données financières
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'profit_margin': float(profit_margin),
            'margin_percentage': float(margin_percentage),
            # Détail des dépenses
            'expenses_breakdown': {
                'suppliers': float(suppliers_expenses),
                'labour': float(labour_expenses),
                'general': float(general_expenses)
            },
            'recent_projects': recent_projects,
            'recent_quotes': recent_quotes,
            'monthly_evolution': monthly_evolution
        })
