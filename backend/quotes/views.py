from rest_framework.decorators import action
from rest_framework.response import Response
from core.views import BaseViewSet
from .models import Quote, QuoteLine, QuoteTracking, QuoteTrackingLine
from .serializers import QuoteSerializer, QuoteLineSerializer, QuoteTrackingSerializer, QuoteTrackingLineSerializer
from documents.models import Document
from django.core.files.base import ContentFile
from django.http import HttpResponse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.utils import ImageReader
from django.conf import settings
import os
import io
from decimal import Decimal

class QuoteViewSet(BaseViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    module_name = 'quotes'

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        quote = self.get_object()
        buffer = io.BytesIO()
        
        # Document Setup
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=30, leftMargin=30, 
            topMargin=5, bottomMargin=50 
        )
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = styles['Title']
        title_style.alignment = 1 # Center
        
        header_style = styles['Heading2']
        header_style.textColor = colors.HexColor('#2c3e50')
        
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        
        # Calculate available width
        available_width = A4[0] - 60 # 30 margin each side

        # --- Header Image ---
        header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
        if os.path.exists(header_path):
            try:
                img_reader = ImageReader(header_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                target_width = available_width * 0.6 # Make it smaller (60% width)
                target_height = target_width * aspect
                # hAlign='CENTER' centers the image
                elements.append(Image(header_path, width=target_width, height=target_height, hAlign='CENTER'))
                elements.append(Spacer(1, 15))
            except Exception as e:
                print(f"Error loading header image: {e}")

        # --- Header Section (Text) ---
        # Company Info (Left) vs Quote Info (Right)
        # Only show company info if header image is NOT present? 
        # Requirement: "Elle doit être affichée avant le contenu du devis".
        # Usually if there is a graphical header, we might skip the text "MULTI RESEAUX SARL", but keep the Quote Info.
        # User said: "entete.png représente l’entête officielle... apparaître avant le contenu". 
        # I will keep the text info below it as it contains specific data not always in a static image (like Quote #).
        
        company_info = [
            Paragraph("<b>MULTI RESEAUX SARL</b>", styles['Heading3']),
            # Paragraph("Adresse: 123 Rue Example", normal_style), # Maybe redundant if in image
        ]
        
        client_name = quote.project.client.nom_client if quote.project and quote.project.client else "Client Inconnu"
        project_name = quote.project.nom_projet if quote.project else "Projet Inconnu"
        
        quote_info = [
            Paragraph(f"<b>DEVIS N°: {quote.numero_devis}</b>", styles['Heading3']),
            Paragraph(f"Date: {quote.date_livraison}", normal_style),
            Paragraph(f"Client: <b>{client_name}</b>", normal_style),
            Paragraph(f"Projet: {project_name}", normal_style),
        ]
        
        # If image exists, maybe we simplify the company info text or keep it.
        # I'll keep the layout but maybe reduced.
        # Let's keep the original layout for robustness.
        
        header_text_data = [
            [
                # Left Column (Company) - Simplified if header exists, or full.
                # Let's keep full for now as per "entete.png represents header" might just mean logo + branding. 
                # If the image CONTAINS the address, this is redundant. 
                # But safer to keep it.
                [Paragraph("<b>MULTI RESEAUX SARL</b>", styles['Heading3'])], 
                
                # Right Column (Quote Info)
                quote_info
            ]
        ]
        
        header_table = Table(header_text_data, colWidths=[250, 250])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        elements.append(header_table)
        elements.append(Spacer(1, 40)) # Espace professionnel augmenté
        
        # --- Object Section ---
        elements.append(Paragraph(f"<b>Objet :</b> {quote.objet}", normal_style))
        elements.append(Spacer(1, 15))

        # --- Lines Table ---
        # Columns: Designation (Wide), Qté, PU, Montant
        data = [['Désignation', 'Qté', 'P.U. (DH)', 'Montant HT (DH)']]
        
        for line in quote.lines.all():
            data.append([
                Paragraph(line.designation, normal_style), # Wrap text
                str(line.quantite),
                f"{line.prix_unitaire:,.2f}",
                f"{line.montant_ht:,.2f}"
            ])
        
        # Table Styling
        col_widths = [available_width * 0.55, available_width * 0.1, available_width * 0.15, available_width * 0.2]
        
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle([
            # Header Row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            
            # Data Rows
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'), # Numbers right aligned
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')]),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # --- Totals Section ---
        # Right aligned table for totals
        total_ht = float(quote.total_ht)
        tva_amount = total_ht * (float(quote.tva) / 100)
        total_ttc = float(quote.total_ttc)

        totals_data = [
            ['Total HT', f"{total_ht:,.2f} DH"],
            [f'TVA ({quote.tva}%)', f"{tva_amount:,.2f} DH"],
            ['Total TTC', f"{total_ttc:,.2f} DH"]
        ]
        
        totals_table = Table(totals_data, colWidths=[100, 100])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('LINEABOVE', (0, 2), (-1, 2), 1, colors.black), # Line above Total TTC
            ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#2c3e50')), # Total TTC color
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#e9ecef')), # Total TTC background
        ]))
        
        # Place totals table to the right
        main_totals_table = Table([[None, totals_table]], colWidths=[available_width - 210, 210])
        elements.append(main_totals_table)
        
        elements.append(Spacer(1, 30))
        
        # --- Footer / Signature ---
        elements.append(Paragraph(f"Arrêté le présent devis à la somme de : <b>{total_ttc:,.2f} Dirhams TTC</b>", normal_style))
        elements.append(Spacer(1, 30))
        
        # Signature Image Preparation
        signature_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.jpeg')
        signature_img = None
        if os.path.exists(signature_path):
            try:
                sig_reader = ImageReader(signature_path)
                sw, sh = sig_reader.getSize()
                s_aspect = sh / float(sw)
                s_target_width = 120 # Reasonable width for signature
                s_target_height = s_target_width * s_aspect
                signature_img = Image(signature_path, width=s_target_width, height=s_target_height)
            except Exception as e:
                print(f"Error loading signature: {e}")

        signature_data_table = [
            ['Signature Client', 'Signature Entreprise'],
            ['', signature_img if signature_img else '']
        ]
        
        signature_table = Table(signature_data_table, colWidths=[available_width/2, available_width/2])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'), # Header row bold
            ('TOPPADDING', (0, 1), (-1, 1), 10), # Padding above signature image
        ]))
        elements.append(signature_table)

        def add_footer(canvas, doc):
            canvas.saveState()
            footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'footer.png')
            if os.path.exists(footer_path):
                try:
                    img_reader = ImageReader(footer_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    
                    # Target width: 90% of page width (larger, clear, centered)
                    page_width = A4[0]
                    target_width = page_width * 0.9 
                    target_height = target_width * aspect
                    
                    # Center x
                    x = (page_width - target_width) / 2
                    # y Position: 10 units from bottom
                    y = 10
                    
                    canvas.drawImage(footer_path, x, y, width=target_width, height=target_height, mask='auto', preserveAspectRatio=True)
                except Exception as e:
                    print(f"Error loading footer: {e}")
            canvas.restoreState()

        doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
        pdf_content = buffer.getvalue()
        buffer.seek(0)
        
        # Save to Documents
        if quote.project:
            file_name = f"devis_{quote.numero_devis}.pdf"
            document = Document(
                name=f"Devis {quote.numero_devis}",
                type_document='PDF',
                project=quote.project
            )
            document.file_url.save(file_name, ContentFile(pdf_content))
            document.save()

        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="devis_{quote.numero_devis}.pdf"'
        return response

    @action(detail=True, methods=['get'], url_path='delivery-preview')
    def get_delivery_preview(self, request, pk=None):
        quote = self.get_object()
        tracking = QuoteTracking.objects.filter(quote=quote).order_by('-created_at').first()
        lines_data = []
        if tracking:
            lines_data = QuoteTrackingLineSerializer(tracking.lines.all(), many=True).data
        else:
            lines_data = QuoteLineSerializer(quote.lines.all(), many=True).data
        return Response(lines_data)

    @action(detail=True, methods=['post'], url_path='generate-delivery-note')
    def generate_delivery_note(self, request, pk=None):
        try:
            quote = self.get_object()
            tracking = QuoteTracking.objects.filter(quote=quote).order_by('-created_at').first()
            
            lines = []
            if tracking:
                lines = tracking.lines.all()
            else:
                lines = quote.lines.all()

            buffer = io.BytesIO()
            
            # Document Setup
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                rightMargin=30, leftMargin=30, 
                topMargin=5, bottomMargin=50 
            )
            elements = []
            styles = getSampleStyleSheet()
            
            title_style = styles['Title']
            title_style.alignment = 1 # Center
            
            header_style = styles['Heading2']
            header_style.textColor = colors.HexColor('#2c3e50')
            
            normal_style = styles['Normal']
            normal_style.fontSize = 10
            
            available_width = A4[0] - 60 

            # --- Header Image ---
            header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
            if os.path.exists(header_path):
                try:
                    img_reader = ImageReader(header_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    target_width = available_width * 0.6
                    target_height = target_width * aspect
                    elements.append(Image(header_path, width=target_width, height=target_height, hAlign='CENTER'))
                    elements.append(Spacer(1, 15))
                except Exception as e:
                    print(f"Error loading header image: {e}")

            client_name = quote.project.client.nom_client if quote.project and quote.project.client else "Client Inconnu"
            project_name = quote.project.nom_projet if quote.project else "Projet Inconnu"
            
            # Header Info
            header_table_data = [
                [
                    # Left
                    [Paragraph("<b>MULTI RESEAUX SARL</b>", styles['Heading3'])],
                    # Right
                    [
                        Paragraph(f"<b>BON DE LIVRAISON</b>", styles['Heading3']),
                        Paragraph(f"Réf Devis: {quote.numero_devis}", normal_style),
                        Paragraph(f"Date: {quote.date_livraison}", normal_style),
                        Paragraph(f"Client: <b>{client_name}</b>", normal_style),
                        Paragraph(f"Projet: {project_name}", normal_style),
                    ]
                ]
            ]
            
            header_table = Table(header_table_data, colWidths=[available_width*0.5, available_width*0.5])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ]))
            elements.append(header_table)
            elements.append(Spacer(1, 20))

            # Title
            elements.append(Paragraph("BON DE LIVRAISON", title_style))
            elements.append(Paragraph(f"Objet: {quote.objet}", normal_style))
            elements.append(Spacer(1, 20))

            # Table Lines
            table_data = [['Désignation', 'Qté', 'P.U (Dhs)', 'Total HT (Dhs)']]
            total_ht_calc = 0
            for line in lines:
                line_total = line.quantite * line.prix_unitaire
                total_ht_calc += line_total
                table_data.append([
                    Paragraph(line.designation, normal_style),
                    str(line.quantite),
                    f"{line.prix_unitaire:,.2f}",
                    f"{line_total:,.2f}"
                ])
                
            t_lines = Table(table_data, colWidths=[available_width*0.5, available_width*0.15, available_width*0.15, available_width*0.2])
            t_lines.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#ecf0f1')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'), # Qty Center
                ('ALIGN', (2, 1), (-1, -1), 'RIGHT'), # Prices Right
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(t_lines)
            elements.append(Spacer(1, 20))

            # Totals
            tva = total_ht_calc * Decimal('0.2')
            total_ttc = total_ht_calc + tva
            total_data = [
                ['Total HT', f"{total_ht_calc:,.2f} Dhs"],
                ['TVA (20%)', f"{tva:,.2f} Dhs"],
                ['Total TTC', f"{total_ttc:,.2f} Dhs"]
            ]

            t_totals = Table(total_data, colWidths=[available_width*0.8, available_width*0.2])
            t_totals.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
                ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'), # Last row Bold
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#bdc3c7')),
                ('PADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(t_totals)
            elements.append(Spacer(1, 30))

            # Signature
            signature_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.jpeg')
            if not os.path.exists(signature_path):
                 signature_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.png')

            signature_img = None
            if os.path.exists(signature_path):
                try:
                    img_reader = ImageReader(signature_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    width = 150 # Increased size
                    height = width * aspect
                    signature_img = Image(signature_path, width=width, height=height)
                except Exception as e:
                    print(f"Error loading signature: {e}")

            signature_data_table = [
                ['Signature Client', 'Signature Entreprise'],
                ['', signature_img if signature_img else '']
            ]
            
            signature_table = Table(signature_data_table, colWidths=[available_width/2, available_width/2])
            signature_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('TOPPADDING', (0, 1), (-1, 1), 10),
            ]))
            elements.append(signature_table)

            def add_footer(canvas, doc):
                canvas.saveState()
                footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'footer.png')
                if os.path.exists(footer_path):
                    try:
                        img_reader = ImageReader(footer_path)
                        iw, ih = img_reader.getSize()
                        aspect = ih / float(iw)
                        target_width = A4[0] * 0.9 
                        target_height = target_width * aspect
                        x = (A4[0] - target_width) / 2
                        y = 10
                        canvas.drawImage(footer_path, x, y, width=target_width, height=target_height, mask='auto', preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error loading footer: {e}")
                canvas.restoreState()

            doc.build(elements, onFirstPage=add_footer, onLaterPages=add_footer)
            pdf_content = buffer.getvalue()
            buffer.seek(0)

            # Save to Documents
            if quote.project:
                file_name = f"BL_{quote.numero_devis}.pdf"
                document = Document(
                    name=f"Bon de Livraison - {quote.numero_devis}",
                    type_document='PDF',
                    project=quote.project
                )
                document.file_url.save(file_name, ContentFile(pdf_content))
                document.save()
                
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="BL_{quote.numero_devis}.pdf"'
            return response
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


class QuoteLineViewSet(BaseViewSet):
    queryset = QuoteLine.objects.all()
    serializer_class = QuoteLineSerializer
    module_name = 'quote_lines'
    filterset_fields = ['quote']
    pagination_class = None # Disable pagination to show all lines

class QuoteTrackingViewSet(BaseViewSet):
    queryset = QuoteTracking.objects.all()
    serializer_class = QuoteTrackingSerializer
    module_name = 'quote_trackings'
    filterset_fields = ['quote']

class QuoteTrackingLineViewSet(BaseViewSet):
    queryset = QuoteTrackingLine.objects.all()
    serializer_class = QuoteTrackingLineSerializer
    module_name = 'quote_tracking_lines'
    filterset_fields = ['tracking']
    pagination_class = None


