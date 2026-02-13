from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Supplier, SupplierInvoice
from .serializers import SupplierSerializer, SupplierInvoiceSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.http import HttpResponse
from django.conf import settings
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.utils import ImageReader
import datetime
import io
import os
from decimal import Decimal

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

    @action(detail=False, methods=['get'], url_path='monthly-report-pdf')
    def monthly_report_pdf(self, request):
        """Génère un PDF mensuel récapitulatif des achats par fournisseur"""
        try:
            # Récupérer le mois et l'année depuis les paramètres de la requête
            year = int(request.query_params.get('year', datetime.date.today().year))
            month = int(request.query_params.get('month', datetime.date.today().month))
            
            # Valider le mois (1-12)
            if not (1 <= month <= 12):
                return Response({'error': 'Mois invalide. Doit être entre 1 et 12.'}, status=400)
            
            # Obtenir le nom du mois en français
            mois_noms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                         'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
            month_name = mois_noms[month]
            
            # Agréger les achats par fournisseur pour ce mois
            purchases = SupplierInvoice.objects.filter(
                date__year=year,
                date__month=month
            ).select_related('supplier')
            
            # Calculer le total par fournisseur
            supplier_totals = {}
            for purchase in purchases:
                supplier_name = purchase.supplier.name
                if supplier_name not in supplier_totals:
                    supplier_totals[supplier_name] = Decimal('0.00')
                supplier_totals[supplier_name] += purchase.amount
            
            # Trier par nom de fournisseur
            sorted_suppliers = sorted(supplier_totals.items())
            
            # Si aucun achat pour ce mois
            if not sorted_suppliers:
                return Response({
                    'error': f'Aucun achat enregistré pour {month_name} {year}'
                }, status=404)
            
            # Créer le PDF
            buffer = io.BytesIO()
            
            # Couleurs (même charte que les devis)
            COLOR_PRIMARY = colors.HexColor('#0095C8')  # Blue
            COLOR_SECONDARY = colors.HexColor('#D01C2B')  # Red
            COLOR_TEXT = colors.HexColor('#2c3e50')
            COLOR_LIGHT_GRAY = colors.HexColor('#f8f9fa')
            
            # Chemins header/footer
            header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
            footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'newfooter.png')
            
            header_height_reserved = 0
            footer_height_reserved = 50
            
            # Calculer la hauteur du header
            if os.path.exists(header_path):
                try:
                    img_reader = ImageReader(header_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    available_width_for_header = (A4[0] - 60) * 0.6
                    header_height_reserved = (available_width_for_header * aspect) + 20
                except Exception as e:
                    print(f"Error checking header size: {e}")
            
            # Calculer la hauteur du footer
            if os.path.exists(footer_path):
                try:
                    img_reader = ImageReader(footer_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    footer_height_reserved = (A4[0] * 0.9 * aspect) + 20
                except Exception as e:
                    print(f"Error checking footer size: {e}")
            
            # Configuration du document avec marges dynamiques
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=30, leftMargin=30,
                topMargin=max(30, header_height_reserved + 10),
                bottomMargin=max(50, footer_height_reserved + 10)
            )
            
            elements = []
            styles = getSampleStyleSheet()
            
            # Style personnalisé
            normal_style = styles['Normal']
            normal_style.fontSize = 10
            normal_style.textColor = COLOR_TEXT
            
            title_style = styles['Heading1']
            title_style.fontSize = 16
            title_style.textColor = COLOR_PRIMARY
            title_style.alignment = 1  # Center
            
            available_width = A4[0] - 60
            
            # Titre
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(f"<b>Récapitulatif des Achats - {month_name} {year}</b>", title_style))
            elements.append(Spacer(1, 20))
            
            # Date de génération
            current_date = datetime.datetime.now().strftime('%d/%m/%Y à %H:%M')
            elements.append(Paragraph(f"<i>Généré le {current_date}</i>", normal_style))
            elements.append(Spacer(1, 20))
            
            # Tableau des achats par fournisseur
            data = [['Fournisseur', 'Total des achats (DH)']]
            
            total_general = Decimal('0.00')
            for supplier_name, total in sorted_suppliers:
                data.append([supplier_name, f"{total:,.2f}".replace(',', ' ')])
                total_general += total
            
            # Ligne de total
            data.append(['', ''])  # Ligne vide
            data.append([Paragraph('<b>TOTAL GÉNÉRAL</b>', normal_style), 
                        Paragraph(f"<b>{total_general:,.2f} DH</b>".replace(',', ' '), normal_style)])
            
            # Créer le tableau
            col_widths = [available_width * 0.60, available_width * 0.40]
            table = Table(data, colWidths=col_widths)
            
            # Style du tableau
            table_style = [
                # En-tête
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                
                # Données
                ('ALIGN', (1, 1), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, 1), (-1, -3), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -3), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -3), [colors.white, COLOR_LIGHT_GRAY]),
                ('GRID', (0, 0), (-1, -3), 0.5, colors.HexColor('#bdc3c7')),
                
                # Ligne de total
                ('LINEABOVE', (0, -1), (-1, -1), 2, COLOR_PRIMARY),
                ('BACKGROUND', (0, -1), (-1, -1), COLOR_LIGHT_GRAY),
                ('ALIGN', (0, -1), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, -1), (-1, -1), 12),
                ('TOPPADDING', (0, -1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, -1), (-1, -1), 10),
            ]
            
            table.setStyle(TableStyle(table_style))
            elements.append(table)
            elements.append(Spacer(1, 30))
            
            # Statistiques supplémentaires
            elements.append(Paragraph(f"<b>Nombre de fournisseurs :</b> {len(sorted_suppliers)}", normal_style))
            elements.append(Paragraph(f"<b>Nombre total d'achats :</b> {purchases.count()}", normal_style))
            
            # Fonction pour dessiner header et footer
            def draw_page_framework(canvas, doc):
                canvas.saveState()
                page_w, page_h = A4
                
                # Header
                if os.path.exists(header_path):
                    try:
                        img = ImageReader(header_path)
                        iw, ih = img.getSize()
                        aspect = ih / float(iw)
                        
                        content_width_h = page_w - 60
                        target_width_h = content_width_h * 0.6
                        target_height_h = target_width_h * aspect
                        
                        x = (page_w - target_width_h) / 2
                        y = page_h - target_height_h - 10
                        
                        canvas.drawImage(header_path, x, y, width=target_width_h, 
                                       height=target_height_h, mask='auto', 
                                       preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing header: {e}")
                
                # Footer
                if os.path.exists(footer_path):
                    try:
                        img = ImageReader(footer_path)
                        iw, ih = img.getSize()
                        aspect = ih / float(iw)
                        
                        target_width_f = page_w * 0.9
                        target_height_f = target_width_f * aspect
                        
                        x = (page_w - target_width_f) / 2
                        y = 10
                        
                        canvas.drawImage(footer_path, x, y, width=target_width_f, 
                                       height=target_height_f, mask='auto', 
                                       preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing footer: {e}")
                
                canvas.restoreState()
            
            # Construire le PDF
            doc.build(elements, onFirstPage=draw_page_framework, 
                     onLaterPages=draw_page_framework)
            
            pdf_content = buffer.getvalue()
            buffer.seek(0)
            
            # Retourner le PDF
            response = HttpResponse(buffer, content_type='application/pdf')
            filename = f'Achats_Fournisseurs_{month_name}_{year}.pdf'
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except Exception as e:
            print(f"Error generating monthly report PDF: {e}")
            return Response({'error': str(e)}, status=500)
