from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from projects.models import Project
from quotes.models import Quote
from invoices.models import Invoice
from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth
from django.utils import timezone
from datetime import timedelta

class DashboardKPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Basic KPIs
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(etat_projet='EN_COURS').count()
        
        total_quotes_amount = Quote.objects.aggregate(Sum('total_ttc'))['total_ttc__sum'] or 0
        total_invoices_amount = Invoice.objects.aggregate(Sum('montant'))['montant__sum'] or 0
        
        # Recent Activity
        recent_projects = Project.objects.order_by('-date_debut')[:5].values('id_project', 'nom_projet', 'etat_projet', 'date_debut')
        recent_quotes = Quote.objects.order_by('-id_quote')[:5].values('id_quote', 'numero_devis', 'total_ttc', 'date_livraison')

        # Monthly Evolution (Last 6 months)
        six_months_ago = timezone.now().date() - timedelta(days=180)
        
        monthly_quotes = Quote.objects.filter(date_livraison__gte=six_months_ago)\
            .annotate(month=TruncMonth('date_livraison'))\
            .values('month')\
            .annotate(count=Count('id_quote'), total=Sum('total_ttc'))\
            .order_by('month')

        monthly_evolution = [
            {
                'month': item['month'].strftime('%Y-%m'),
                'quotes_count': item['count'],
                'quotes_amount': item['total']
            }
            for item in monthly_quotes
        ]

        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'total_quotes_amount': total_quotes_amount,
            'total_invoices_amount': total_invoices_amount,
            'recent_projects': recent_projects,
            'recent_quotes': recent_quotes,
            'monthly_evolution': monthly_evolution
        })
