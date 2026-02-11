from rest_framework.decorators import action
from rest_framework.response import Response
from core.views import BaseViewSet
from .models import Quote, QuoteLine, QuoteTracking, QuoteTrackingLine, QuoteGroup, QuoteTrackingGroup
from .serializers import QuoteSerializer, QuoteLineSerializer, QuoteTrackingSerializer, QuoteTrackingLineSerializer, QuoteGroupSerializer, QuoteTrackingGroupSerializer
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
from datetime import datetime

def number_to_words_fr(number):
    """Convert a number to French words for invoice amounts."""
    units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
    teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
    tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"]
    
    def convert_below_thousand(n):
        if n == 0:
            return ""
        elif n < 10:
            return units[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 70:
            unit = n % 10
            ten = n // 10
            if unit == 0:
                return tens[ten]
            elif unit == 1 and ten in [2, 3, 4, 5, 6]:
                return tens[ten] + "-et-un"
            else:
                return tens[ten] + "-" + units[unit]
        elif n < 80:
            return "soixante-" + teens[n - 70]
        elif n < 100:
            unit = n % 10
            if n == 80:
                return "quatre-vingts"
            elif unit == 0:
                return "quatre-vingt"
            else:
                return "quatre-vingt-" + units[unit] if n < 90 else "quatre-vingt-" + teens[n - 90]
        else:
            hundreds = n // 100
            remainder = n % 100
            if hundreds == 1:
                hundred_word = "cent"
            else:
                hundred_word = units[hundreds] + " cent"
            if remainder == 0 and hundreds > 1:
                hundred_word += "s"
            if remainder > 0:
                return hundred_word + " " + convert_below_thousand(remainder)
            return hundred_word
    
    # Handle decimal number
    integer_part = int(number)
    decimal_part = int(round((number - integer_part) * 100))
    
    if integer_part == 0:
        result = "zéro"
    elif integer_part < 1000:
        result = convert_below_thousand(integer_part)
    elif integer_part < 1000000:
        thousands = integer_part // 1000
        remainder = integer_part % 1000
        if thousands == 1:
            result = "mille"
        else:
            result = convert_below_thousand(thousands) + " mille"
        if remainder > 0:
            result += " " + convert_below_thousand(remainder)
    elif integer_part < 1000000000:
        millions = integer_part // 1000000
        remainder = integer_part % 1000000
        if millions == 1:
            result = "un million"
        else:
            result = convert_below_thousand(millions) + " millions"
        if remainder >= 1000:
            thousands = remainder // 1000
            if thousands == 1:
                result += " mille"
            else:
                result += " " + convert_below_thousand(thousands) + " mille"
            remainder = remainder % 1000
        if remainder > 0:
            result += " " + convert_below_thousand(remainder)
    else:
        result = str(integer_part)
    
    # Capitalize first letter
    result = result.strip().capitalize()
    
    return f"{result} Dirhams {decimal_part:02d} CTS"

class QuoteViewSet(BaseViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    module_name = 'quotes'

    @action(detail=True, methods=['get'], url_path='pdf')
    def generate_pdf(self, request, pk=None):
        quote = self.get_object()
        buffer = io.BytesIO()
        
        # Colors
        COLOR_PRIMARY = colors.HexColor('#0095C8') # Blue
        COLOR_SECONDARY = colors.HexColor('#D01C2B') # Red
        COLOR_TEXT = colors.HexColor('#2c3e50')
        COLOR_LIGHT_GRAY = colors.HexColor('#f8f9fa')
        
        # --- Pre-calculate Header/Footer Dimensions for Margins ---
        header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
        footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'newfooter.png')
        
        header_height_reserved = 0
        footer_height_reserved = 50 

        # Calculate Header Height
        if os.path.exists(header_path):
            try:
                img_reader = ImageReader(header_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                # Keep logo professional size (approx 60% of content width)
                # Available width is A4[0] - margins(60)
                available_width_for_header = (A4[0] - 60) * 0.6
                header_height_reserved = (available_width_for_header * aspect) + 20
            except Exception as e:
                print(f"Error checking header size: {e}")

        # Calculate Footer Height
        if os.path.exists(footer_path):
            try:
                img_reader = ImageReader(footer_path)
                iw, ih = img_reader.getSize()
                aspect = ih / float(iw)
                # Footer is usually 90% of page width
                footer_height_reserved = (A4[0] * 0.9 * aspect) + 20
            except Exception as e:
                print(f"Error checking footer size: {e}")
        
        # Document Setup with Dynamic Margins
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=A4,
            rightMargin=30, leftMargin=30, 
            topMargin=max(30, header_height_reserved + 10), 
            bottomMargin=max(50, footer_height_reserved + 10) 
        )
        
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom Styles
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        normal_style.textColor = COLOR_TEXT
        
        # Calculate available width based on margins
        available_width = A4[0] - 60 

        # Note: Header Image is removed from 'elements' to be handled by Page Template
        
        # --- 2. Info Block (2 Columns) ---
        client = quote.project.client if quote.project else None
        
        # Left Column Data
        formatted_date = quote.date_livraison.strftime('%d/%m/%Y') if quote.date_livraison else datetime.now().strftime('%d/%m/%Y')
        info_left = [
            Paragraph(f"<b>Date :</b> {formatted_date}", normal_style),
            Paragraph(f"<b>Devis N° :</b> {quote.numero_devis}", normal_style),
            Paragraph(f"<b>Objet :</b> {quote.objet}", normal_style)
        ]
        
        # Right Column Data
        client_name = client.nom_client if client else "Client Inconnu"
        client_address = client.adresse if client and client.adresse else ""
        client_ice = client.ice if client and client.ice else ""
        
        info_right = [
            Paragraph(f"<b>Client :</b> {client_name}", normal_style),
        ]
        if client_address:
             info_right.append(Paragraph(f"Adresse : {client_address}", normal_style))
        if client_ice:
             info_right.append(Paragraph(f"ICE : {client_ice}", normal_style))
             
        # Create Table for Info Block
        info_data = [[info_left, info_right]]
        
        info_table = Table(info_data, colWidths=[available_width/2, available_width/2])
        info_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (0,0), 0),   # Left col padding
            ('LEFTPADDING', (1,0), (1,0), 20),  # Right col padding
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))

        # --- 3. Quote Table ---
        data = [['Désignation', 'Qté', 'P.U. (DH)', 'Total (DH)']]
        
        # Define base styles
        style_cmds = [
            # Header Row
            ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            
            # General Data Rows
            ('ALIGN', (1, 1), (-1, -1), 'RIGHT'), # Numbers right aligned
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')), # Fine borders
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]
        
        groups = quote.groups.all().order_by('id')
        has_groups = groups.exists()
        current_row = 1

        def add_line_row(line):
            nonlocal current_row
            data.append([
                Paragraph(line.designation, normal_style),
                str(line.quantite),
                f"{line.prix_unitaire:,.2f}",
                f"{line.montant_ht:,.2f}"
            ])
            # Alternating background could be added here if needed
            current_row += 1

        if not has_groups:
             # Legacy / Flat behavior
             for line in quote.lines.all():
                 add_line_row(line)
        else:
             # Grouped behavior
             ungrouped_lines = quote.lines.filter(group__isnull=True)
             
             # 1. Output ungrouped lines first (if any)
             if ungrouped_lines.exists():
                 data.append([Paragraph("<b>Divers / Général</b>", normal_style), "", "", ""])
                 style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                 style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#ecf0f1')))
                 style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                 current_row += 1
                 
                 for line in ungrouped_lines:
                     add_line_row(line)
            
             # 2. Output Groups
             for group in groups:
                 # Group Header
                 data.append([Paragraph(f"<b>{group.name}</b>", normal_style), "", "", ""])
                 style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                 style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#ecf0f1')))
                 style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                 current_row += 1
                 
                 group_lines = group.lines.all()
                 group_total = 0
                 for line in group_lines:
                     add_line_row(line)
                     group_total += line.montant_ht
                 
                 # Group Subtotal
                 data.append(["", "", "S/Total", f"{group_total:,.2f}"])
                 style_cmds.append(('FONTNAME', (2, current_row), (3, current_row), 'Helvetica-Bold'))
                 # Remove grid for empty cells?
                 # style_cmds.append(('LINEBELOW', (0, current_row), (-1, current_row), 1, colors.black))
                 current_row += 1
        
        # Table Styling
        col_widths = [available_width * 0.55, available_width * 0.1, available_width * 0.15, available_width * 0.2]
        
        t = Table(data, colWidths=col_widths)
        t.setStyle(TableStyle(style_cmds))
        elements.append(t)
        elements.append(Spacer(1, 15))

        # --- 4. Totals Section ---
        total_ht = float(quote.total_ht)
        tva_amount = total_ht * (float(quote.tva) / 100)
        total_ttc = float(quote.total_ttc)

        totals_data = [
            ['Total HT', f"{total_ht:,.2f} DH"],
            [f'TVA ({quote.tva}%)', f"{tva_amount:,.2f} DH"],
            ['Total TTC', f"{total_ttc:,.2f} DH"]
        ]
        
        totals_table = Table(totals_data, colWidths=[100, 120])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
            
            # Total TTC Highlight
            ('TEXTCOLOR', (0, 2), (-1, 2), COLOR_TEXT), 
            ('FONTSIZE', (0, 2), (-1, 2), 11),
            ('LINEABOVE', (0, 2), (-1, 2), 1, COLOR_PRIMARY), 
            ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#ecf0f1')),
            
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        # Place totals table to the right
        main_totals_table = Table([[None, totals_table]], colWidths=[available_width - 220, 220])
        elements.append(main_totals_table)
        
        elements.append(Spacer(1, 30))
        
        # --- 5. Footer / Signature ---
        elements.append(Paragraph(f"Arrêté le présent devis à la somme de : <b>{total_ttc:,.2f} Dirhams TTC</b>", normal_style))
        elements.append(Spacer(1, 30))
        
        # Signature Image
        signature_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.jpeg')
        signature_content = [Paragraph("<b>Signature</b>", styles['Normal'])]
        
        if os.path.exists(signature_path):
            try:
                sig_reader = ImageReader(signature_path)
                sw, sh = sig_reader.getSize()
                s_aspect = sh / float(sw)
                s_target_width = 120 
                s_target_height = s_target_width * s_aspect
                signature_content.append(Image(signature_path, width=s_target_width, height=s_target_height))
            except Exception as e:
                print(f"Error loading signature: {e}")

        # Table for signature at bottom right
        signature_data_table = [
            [None, signature_content]
        ]
        
        signature_table = Table(signature_data_table, colWidths=[available_width - 150, 150])
        signature_table.setStyle(TableStyle([
            ('ALIGN', (1, 0), (1, 0), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(signature_table)

        # --- HEADER & FOOTER ON CANVAS ---
        def draw_page_framework(canvas, doc):
            canvas.saveState()
            page_w, page_h = A4
            
            # Draw Header (Fixed Position Top)
            if os.path.exists(header_path):
                try:
                    img = ImageReader(header_path)
                    iw, ih = img.getSize()
                    aspect = ih / float(iw)
                    
                    content_width_h = page_w - 60
                    target_width_h = content_width_h * 0.6
                    target_height_h = target_width_h * aspect
                    
                    x = (page_w - target_width_h) / 2
                    y = page_h - target_height_h - 10 # 10 padding from top
                    
                    canvas.drawImage(header_path, x, y, width=target_width_h, height=target_height_h, mask='auto', preserveAspectRatio=True)
                except Exception as e:
                    print(f"Error drawing header on page: {e}")

            # Draw Footer (Fixed Position Bottom)
            if os.path.exists(footer_path):
                try:
                    img = ImageReader(footer_path)
                    iw, ih = img.getSize()
                    aspect = ih / float(iw)
                    
                    target_width_f = page_w * 0.9 
                    target_height_f = target_width_f * aspect
                    
                    x = (page_w - target_width_f) / 2
                    y = 10 
                    
                    canvas.drawImage(footer_path, x, y, width=target_width_f, height=target_height_f, mask='auto', preserveAspectRatio=True)
                except Exception as e:
                    print(f"Error drawing footer on page: {e}")
            canvas.restoreState()

        # Build PDF with Page Template
        doc.build(elements, onFirstPage=draw_page_framework, onLaterPages=draw_page_framework)
        
        pdf_content = buffer.getvalue()
        buffer.seek(0)
        
        # Save to Documents
        if quote.project:
            file_name = f"devis_{quote.numero_devis}.pdf"
            document_name = f"Devis {quote.numero_devis}"
            
            # Delete existing document with same name to keep only latest version
            existing_docs = Document.objects.filter(
                name=document_name,
                project=quote.project
            )
            for doc in existing_docs:
                if doc.file_url:
                    doc.file_url.delete(save=False)
                doc.delete()
            
            document = Document(
                name=document_name,
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
        """Retourne les données du devis avec groupes et lignes pour l'aperçu du BL"""
        quote = self.get_object()
        tracking = QuoteTracking.objects.filter(quote=quote).order_by('-created_at').first()
        
        # Si on a un tracking, on utilise ses données, sinon on utilise le devis original
        if tracking:
            serializer = QuoteTrackingSerializer(tracking)
        else:
            # Créer une structure similaire à partir du devis
            groups_data = QuoteGroupSerializer(quote.groups.all(), many=True).data
            ungrouped_lines = quote.lines.filter(group__isnull=True)
            ungrouped_data = QuoteLineSerializer(ungrouped_lines, many=True).data
            
            return Response({
                'groups': groups_data,
                'ungrouped_lines': ungrouped_data,
                'has_groups': quote.groups.exists()
            })
        
        return Response({
            'groups': serializer.data.get('groups', []),
            'ungrouped_lines': serializer.data.get('ungrouped_lines', []),
            'has_groups': len(serializer.data.get('groups', [])) > 0
        })

    @action(detail=True, methods=['post'], url_path='generate-delivery-note')
    def generate_delivery_note(self, request, pk=None):
        try:
            quote = self.get_object()
            
            # Get inputs
            bl_number = request.data.get('bl_number')
            bc_number = request.data.get('bc_number')
            
            # Find existing tracking or create new one
            tracking = QuoteTracking.objects.filter(quote=quote).order_by('-created_at').first()
            
            if not tracking:
                # Create new tracking if none exists to ensure we have a source of truth for the BL
                tracking = QuoteTracking.objects.create(
                    quote=quote,
                    bl_number=bl_number,
                    bc_number=bc_number
                )
                # Copy lines from quote to tracking
                for line in quote.lines.all():
                    QuoteTrackingLine.objects.create(
                        tracking=tracking,
                        designation=line.designation,
                        quantite=line.quantite,
                        prix_unitaire=line.prix_unitaire
                    )
            else:
                # Update existing tracking
                if bl_number: tracking.bl_number = bl_number
                if bc_number: tracking.bc_number = bc_number
                tracking.save()

            # Determine values to display
            display_bl_number = tracking.bl_number if tracking.bl_number else f"BL-{quote.numero_devis}"
            display_bc_number = tracking.bc_number if tracking.bc_number else ""
            
            # Use tracking lines as the source of truth
            lines = tracking.lines.all()

            buffer = io.BytesIO()
            
            # Colors
            COLOR_PRIMARY = colors.HexColor('#0095C8') # Blue
            COLOR_SECONDARY = colors.HexColor('#D01C2B') # Red
            COLOR_TEXT = colors.HexColor('#2c3e50')
            COLOR_LIGHT_GRAY = colors.HexColor('#f8f9fa')

             # --- Pre-calculate Header/Footer Dimensions for Margins ---
            header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
            footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'newfooter.png')
            
            header_height_reserved = 0
            footer_height_reserved = 50 

            # Calculate Header Height
            if os.path.exists(header_path):
                try:
                    img_reader = ImageReader(header_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    available_width_for_header = (A4[0] - 60) * 0.6
                    header_height_reserved = (available_width_for_header * aspect) + 20
                except Exception as e:
                    print(f"Error checking header size: {e}")

            # Calculate Footer Height
            if os.path.exists(footer_path):
                try:
                    img_reader = ImageReader(footer_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    footer_height_reserved = (A4[0] * 0.9 * aspect) + 20
                except Exception as e:
                    print(f"Error checking footer size: {e}")

            # Document Setup with Dynamic Margins
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                rightMargin=30, leftMargin=30, 
                topMargin=max(30, header_height_reserved + 10), 
                bottomMargin=max(50, footer_height_reserved + 10) 
            )

            elements = []
            styles = getSampleStyleSheet()
            
            normal_style = styles['Normal']
            normal_style.fontSize = 10
            normal_style.textColor = COLOR_TEXT
            
            available_width = A4[0] - 60 

            # Note: Header removed from elements


            # --- 2. Info Block (2 Columns) ---
            client = quote.project.client if quote.project else None
            
            # Left Column: Date, N° BL, N° BC, Objet
            current_date_str = datetime.now().strftime('%d/%m/%Y')
            
            info_left = [
                Paragraph(f"<b>Date :</b> {current_date_str}", normal_style),
                Paragraph(f"<b>N° BL :</b> {display_bl_number}", normal_style),
            ]
            if display_bc_number:
                info_left.append(Paragraph(f"<b>N° BC :</b> {display_bc_number}", normal_style))
                
            info_left.append(Paragraph(f"<b>Objet :</b> {quote.objet}", normal_style))
            
            # Right Column: Client, Address, ICE
            client_name = client.nom_client if client else "Client Inconnu"
            client_address = client.adresse if client and client.adresse else ""
            client_ice = client.ice if client and client.ice else ""
            
            info_right = [
                Paragraph(f"<b>Client :</b> {client_name}", normal_style),
            ]
            if client_address:
                 info_right.append(Paragraph(f"Adresse : {client_address}", normal_style))
            if client_ice:
                 info_right.append(Paragraph(f"ICE : {client_ice}", normal_style))
             
            # Create Table for Info Block
            info_data = [[info_left, info_right]]
            
            info_table = Table(info_data, colWidths=[available_width/2, available_width/2])
            info_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (0,0), 0),   # Left col padding
                ('LEFTPADDING', (1,0), (1,0), 20),  # Right col padding
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 20))
            
            # --- 3. Delivery Table with Groups Support ---
            data = [['Désignation', 'Qté', 'P.U (HT)', 'Total (HT)']]
            
            style_cmds = [
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]
            
            groups = []
            has_groups = False
            if tracking:
                groups = tracking.groups.all().order_by('order', 'id')
                has_groups = groups.exists()
            else:
                groups = quote.groups.all().order_by('order', 'id')
                has_groups = groups.exists()
            
            current_row = 1
            total_ht_calc = 0
            
            def add_line_row(line):
                nonlocal current_row, total_ht_calc
                montant_ht = line.quantite * line.prix_unitaire
                total_ht_calc += montant_ht
                data.append([Paragraph(line.designation, normal_style), str(line.quantite), f"{line.prix_unitaire:,.2f}", f"{montant_ht:,.2f}"])
                current_row += 1
            
            if not has_groups:
                for line in lines:
                    add_line_row(line)
            else:
                ungrouped_lines = lines.filter(group__isnull=True)
                for group in groups:
                    data.append([Paragraph(f"<b>{group.name}</b>", normal_style), "", "", ""])
                    style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                    style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#ecf0f1')))
                    style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                    current_row += 1
                    for line in group.lines.all():
                        add_line_row(line)
                if ungrouped_lines.exists():
                    data.append([Paragraph("<b>Divers / Général</b>", normal_style), "", "", ""])
                    style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                    style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#ecf0f1')))
                    style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                    current_row += 1
                    for line in ungrouped_lines:
                        add_line_row(line)
            
            col_widths = [available_width * 0.55, available_width * 0.1, available_width * 0.15, available_width * 0.2]
            t = Table(data, colWidths=col_widths)
            t.setStyle(TableStyle(style_cmds))
            elements.append(t)
            elements.append(Spacer(1, 15))

            # --- 4. Totals Section ---
            tva_amount = total_ht_calc * (Decimal(quote.tva) / 100)
            total_ttc = total_ht_calc + tva_amount

            totals_data = [
                ['Total HT', f"{total_ht_calc:,.2f} DH"],
                [f'TVA ({quote.tva}%)', f"{tva_amount:,.2f} DH"],
                ['Total TTC', f"{total_ttc:,.2f} DH"]
            ]
            
            totals_table = Table(totals_data, colWidths=[100, 120])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
                
                # Total TTC Highlight
                ('TEXTCOLOR', (0, 2), (-1, 2), COLOR_TEXT),
                ('FONTSIZE', (0, 2), (-1, 2), 11),
                ('LINEABOVE', (0, 2), (-1, 2), 1, COLOR_PRIMARY), 
                ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#ecf0f1')),
                
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            # Place totals table to the right
            main_totals_table = Table([[None, totals_table]], colWidths=[available_width - 220, 220])
            elements.append(main_totals_table)
            elements.append(Spacer(1, 30))

            # --- 5. Signature Section ---
            
            # Client Signature (Simple Text, No Box)
            client_sig_text = [
                Paragraph("<b>Signature du Client :</b>", normal_style),
                Spacer(1, 40)
            ]
            
            client_sig_table = Table([[client_sig_text]], colWidths=[200])
            client_sig_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ]))

            # Provider Signature (Text only, no image)
            provider_sig_text = [
                Paragraph("<b>Signature du Prestataire :</b>", normal_style),
                Spacer(1, 40)
            ]
            
            provider_sig_table = Table([[provider_sig_text]], colWidths=[200])
            provider_sig_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            # Layout: Client Left, Provider Right
            sigs_data = [[client_sig_table, provider_sig_table]]
            sigs_layout_table = Table(sigs_data, colWidths=[available_width/2, available_width/2])
            sigs_layout_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(sigs_layout_table)

             # --- HEADER & FOOTER ON CANVAS ---
            def draw_page_framework(canvas, doc):
                canvas.saveState()
                page_w, page_h = A4
                
                # Draw Header (Fixed Position Top)
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
                        
                        canvas.drawImage(header_path, x, y, width=target_width_h, height=target_height_h, mask='auto', preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing header on page: {e}")

                # Draw Footer (Fixed Position Bottom)
                if os.path.exists(footer_path):
                    try:
                        img = ImageReader(footer_path)
                        iw, ih = img.getSize()
                        aspect = ih / float(iw)
                        
                        target_width_f = page_w * 0.9 
                        target_height_f = target_width_f * aspect
                        
                        x = (page_w - target_width_f) / 2
                        y = 10 
                        
                        canvas.drawImage(footer_path, x, y, width=target_width_f, height=target_height_f, mask='auto', preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing footer on page: {e}")
                canvas.restoreState()

            doc.build(elements, onFirstPage=draw_page_framework, onLaterPages=draw_page_framework)
            pdf_content = buffer.getvalue()
            buffer.seek(0)
            
            file_name = f"BL_{quote.numero_devis}.pdf"
            if display_bl_number:
                 # Sanitize filename
                 safe_bl = "".join(c for c in display_bl_number if c.isalnum() or c in ('-','_'))
                 file_name = f"BL_{safe_bl}.pdf"

            if quote.project:
                document_name = f"Bon de Livraison {display_bl_number}"
                
                # Delete existing document with same name to keep only latest version
                existing_docs = Document.objects.filter(
                    name=document_name,
                    project=quote.project
                )
                for doc in existing_docs:
                    if doc.file_url:
                        doc.file_url.delete(save=False)
                    doc.delete()
                
                document = Document(
                    name=document_name,
                    type_document='PDF',
                    project=quote.project
                )
                document.file_url.save(file_name, ContentFile(pdf_content))
                document.save()
            
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            return response

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


    @action(detail=True, methods=['post'], url_path='generate-invoice')
    def generate_invoice(self, request, pk=None):
        try:
            quote = self.get_object()
            
            # Get inputs
            invoice_number = request.data.get('invoice_number')
            bc_number = request.data.get('bc_number')
            
            # Find existing tracking or create new one
            tracking = QuoteTracking.objects.filter(quote=quote).order_by('-created_at').first()
            
            if not tracking:
                tracking = QuoteTracking.objects.create(
                    quote=quote,
                    invoice_number=invoice_number,
                    bc_number=bc_number
                )
                for line in quote.lines.all():
                    QuoteTrackingLine.objects.create(
                        tracking=tracking,
                        designation=line.designation,
                        quantite=line.quantite,
                        prix_unitaire=line.prix_unitaire
                    )
            else:
                if invoice_number: tracking.invoice_number = invoice_number
                if bc_number: tracking.bc_number = bc_number
                tracking.save()

            # Determine values to display
            display_invoice_number = tracking.invoice_number if tracking.invoice_number else f"FACTURE-{quote.numero_devis}"
            display_bc_number = tracking.bc_number if tracking.bc_number else ""
            
            # Use tracking lines as the source of truth
            lines = tracking.lines.all()

            buffer = io.BytesIO()
            
            # Colors
            COLOR_PRIMARY = colors.HexColor('#0095C8') # Blue
            COLOR_SECONDARY = colors.HexColor('#D01C2B') # Red
            COLOR_TEXT = colors.HexColor('#2c3e50')
            COLOR_LIGHT_GRAY = colors.HexColor('#f8f9fa')

             # --- Pre-calculate Header/Footer Dimensions for Margins ---
            header_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'entete.png')
            footer_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'newfooter.png')
            
            header_height_reserved = 0
            footer_height_reserved = 50 

            # Calculate Header Height
            if os.path.exists(header_path):
                try:
                    img_reader = ImageReader(header_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    available_width_for_header = (A4[0] - 60) * 0.6
                    header_height_reserved = (available_width_for_header * aspect) + 20
                except Exception as e:
                    print(f"Error checking header size: {e}")

            # Calculate Footer Height
            if os.path.exists(footer_path):
                try:
                    img_reader = ImageReader(footer_path)
                    iw, ih = img_reader.getSize()
                    aspect = ih / float(iw)
                    footer_height_reserved = (A4[0] * 0.9 * aspect) + 20
                except Exception as e:
                    print(f"Error checking footer size: {e}")
            
            # Document Setup with Dynamic Margins
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                rightMargin=30, leftMargin=30, 
                topMargin=max(30, header_height_reserved + 10), 
                bottomMargin=max(50, footer_height_reserved + 10) 
            )

            elements = []
            styles = getSampleStyleSheet()
            
            normal_style = styles['Normal']
            normal_style.fontSize = 10
            normal_style.textColor = COLOR_TEXT
            
            available_width = A4[0] - 60 

            # Note: Header removed from elements


            # --- 2. Info Block (2 Columns) ---
            client = quote.project.client if quote.project else None
            
            # Left Column: Date, N° Facture, N° BC, Objet
            current_date_str = datetime.now().strftime('%d/%m/%Y')
            
            info_left = [
                Paragraph(f"<b>Date :</b> {current_date_str}", normal_style),
                Paragraph(f"<b>N° Facture :</b> {display_invoice_number}", normal_style),
            ]
            if display_bc_number:
                info_left.append(Paragraph(f"<b>N° BC :</b> {display_bc_number}", normal_style))
                
            info_left.append(Paragraph(f"<b>Objet :</b> {quote.objet}", normal_style))
            
            # Right Column: Client, Address, ICE
            client_name = client.nom_client if client else "Client Inconnu"
            client_address = client.adresse if client and client.adresse else ""
            client_ice = client.ice if client and client.ice else ""
            
            info_right = [
                Paragraph(f"<b>Client :</b> {client_name}", normal_style),
            ]
            if client_address:
                 info_right.append(Paragraph(f"Adresse : {client_address}", normal_style))
            if client_ice:
                 info_right.append(Paragraph(f"ICE : {client_ice}", normal_style))
             
            # Create Table for Info Block
            info_data = [[info_left, info_right]]
            
            info_table = Table(info_data, colWidths=[available_width/2, available_width/2])
            info_table.setStyle(TableStyle([
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LEFTPADDING', (0,0), (0,0), 0),
                ('LEFTPADDING', (1,0), (1,0), 20),
            ]))
            elements.append(info_table)
            elements.append(Spacer(1, 20))
            
            # --- 3. Delivery Table with Groups Support ---
            data = [['Désignation', 'Qté', 'P.U (HT)', 'Total (HT)']]
            
            style_cmds = [
                ('BACKGROUND', (0, 0), (-1, 0), COLOR_PRIMARY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('TOPPADDING', (0, 0), (-1, 0), 10),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bdc3c7')),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]
            
            groups = []
            has_groups = False
            if tracking:
                groups = tracking.groups.all().order_by('order', 'id')
                has_groups = groups.exists()
            else:
                groups = quote.groups.all().order_by('order', 'id')
                has_groups = groups.exists()
            
            current_row = 1
            total_ht_calc = 0
            
            def add_line_row(line):
                nonlocal current_row, total_ht_calc
                montant_ht = line.quantite * line.prix_unitaire
                total_ht_calc += montant_ht
                data.append([Paragraph(line.designation, normal_style), str(line.quantite), f"{line.prix_unitaire:,.2f}", f"{montant_ht:,.2f}"])
                current_row += 1
            
            if not has_groups:
                for line in lines:
                    add_line_row(line)
            else:
                ungrouped_lines = lines.filter(group__isnull=True)
                for group in groups:
                    data.append([Paragraph(f"<b>{group.name}</b>", normal_style), "", "", ""])
                    style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                    style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row), colors.HexColor('#ecf0f1')))
                    style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                    current_row += 1
                    for line in group.lines.all():
                        add_line_row(line)
                if ungrouped_lines.exists():
                    data.append([Paragraph("<b>Divers / Général</b>", normal_style), "", "", ""])
                    style_cmds.append(('SPAN', (0, current_row), (-1, current_row)))
                    style_cmds.append(('BACKGROUND', (0, current_row), (-1, current_row),colors.HexColor('#ecf0f1')))
                    style_cmds.append(('ALIGN', (0, current_row), (-1, current_row), 'LEFT'))
                    current_row += 1
                    for line in ungrouped_lines:
                        add_line_row(line)
            
            col_widths = [available_width * 0.55, available_width * 0.1, available_width * 0.15, available_width * 0.2]
            t = Table(data, colWidths=col_widths)
            t.setStyle(TableStyle(style_cmds))
            elements.append(t)
            elements.append(Spacer(1, 15))

            # --- 4. Totals Section ---
            tva_amount = total_ht_calc * (Decimal(quote.tva) / 100)
            total_ttc = total_ht_calc + tva_amount

            totals_data = [
                ['Total HT', f"{total_ht_calc:,.2f} DH"],
                [f'TVA ({quote.tva}%)', f"{tva_amount:,.2f} DH"],
                ['Total TTC', f"{total_ttc:,.2f} DH"]
            ]
            
            totals_table = Table(totals_data, colWidths=[100, 120])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_TEXT),
                
                # Total TTC Highlight
                ('TEXTCOLOR', (0, 2), (-1, 2), COLOR_TEXT),
                ('FONTSIZE', (0, 2), (-1, 2), 11),
                ('LINEABOVE', (0, 2), (-1, 2), 1, COLOR_PRIMARY), 
                ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#ecf0f1')),
                
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            # Place totals table to the right
            main_totals_table = Table([[None, totals_table]], colWidths=[available_width - 220, 220])
            elements.append(main_totals_table)
            elements.append(Spacer(1, 15))
            
            # Amount in words
            amount_in_words = number_to_words_fr(float(total_ttc))
            amount_text = f"Arrêtée la présente Facture à la Somme Total T.T.C de : <b>{amount_in_words} T.T.C</b>"
            elements.append(Paragraph(amount_text, normal_style))
            elements.append(Spacer(1, 20))

             # --- 5. Signature Section ---
            
            # Client Signature (Simple Text, No Box)
            client_sig_text = [
                Paragraph("<b>Signature du Client :</b>", normal_style),
                Spacer(1, 40)
            ]
            
            client_sig_table = Table([[client_sig_text]], colWidths=[200])
            client_sig_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ]))

            # Provider Signature (Text only, no image)
            provider_sig_text = [
                Paragraph("<b>Signature du Prestataire :</b>", normal_style),
                Spacer(1, 40)
            ]
            
            provider_sig_table = Table([[provider_sig_text]], colWidths=[200])
            provider_sig_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            # Layout: Client Left, Provider Right
            sigs_data = [[client_sig_table, provider_sig_table]]
            sigs_layout_table = Table(sigs_data, colWidths=[available_width/2, available_width/2])
            sigs_layout_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(sigs_layout_table)

             # --- HEADER & FOOTER ON CANVAS ---
            def draw_page_framework(canvas, doc):
                canvas.saveState()
                page_w, page_h = A4
                
                # Draw Header (Fixed Position Top)
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
                        
                        canvas.drawImage(header_path, x, y, width=target_width_h, height=target_height_h, mask='auto', preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing header on page: {e}")

                # Draw Footer (Fixed Position Bottom)
                if os.path.exists(footer_path):
                    try:
                        img = ImageReader(footer_path)
                        iw, ih = img.getSize()
                        aspect = ih / float(iw)
                        
                        target_width_f = page_w * 0.9 
                        target_height_f = target_width_f * aspect
                        
                        x = (page_w - target_width_f) / 2
                        y = 10 
                        
                        canvas.drawImage(footer_path, x, y, width=target_width_f, height=target_height_f, mask='auto', preserveAspectRatio=True)
                    except Exception as e:
                        print(f"Error drawing footer on page: {e}")
                canvas.restoreState()

            doc.build(elements, onFirstPage=draw_page_framework, onLaterPages=draw_page_framework)
            pdf_content = buffer.getvalue()
            buffer.seek(0)
            
            file_name = f"Facture_{display_invoice_number}.pdf"
            # Sanitize
            safe_fn = "".join(c for c in display_invoice_number if c.isalnum() or c in ('-','_'))
            file_name = f"Facture_{safe_fn}.pdf"

            if quote.project:
                document_name = f"Facture {display_invoice_number}"
                
                # Delete existing document with same name to keep only latest version
                existing_docs = Document.objects.filter(
                    name=document_name,
                    project=quote.project
                )
                for doc in existing_docs:
                    if doc.file_url:
                        doc.file_url.delete(save=False)
                    doc.delete()
                
                document = Document(
                    name=document_name,
                    type_document='PDF',
                    project=quote.project
                )
                document.file_url.save(file_name, ContentFile(pdf_content))
                document.save()
            
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{file_name}"'
            return response

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=400)


class QuoteLineViewSet(BaseViewSet):
    queryset = QuoteLine.objects.all().order_by('id')
    serializer_class = QuoteLineSerializer
    module_name = 'quote_lines'
    filterset_fields = ['quote']
    pagination_class = None # Disable pagination to show all lines
    
    @action(detail=False, methods=['POST'], url_path='reset-tracking')
    def reset_tracking(self, request):
        """Réinitialiser le suivi des modifications pour toutes les lignes d'un devis"""
        quote_id = request.data.get('quote_id')
        if not quote_id:
            return Response({'error': 'quote_id requis'}, status=400)
        
        # Réinitialiser toutes les lignes du devis
        lines = QuoteLine.objects.filter(quote_id=quote_id)
        updated_count = 0
        for line in lines:
            line.change_status = 'unchanged'
            line.original_designation = None
            line.original_quantite = None
            line.original_prix_unitaire = None
            line.save()
            updated_count += 1
        
        return Response({
            'status': 'success',
            'message': f'{updated_count} ligne(s) réinitialisée(s)',
            'updated_count': updated_count
        })

class QuoteTrackingViewSet(BaseViewSet):
    queryset = QuoteTracking.objects.all()
    serializer_class = QuoteTrackingSerializer
    module_name = 'quote_trackings'
    filterset_fields = ['quote']

class QuoteTrackingLineViewSet(BaseViewSet):
    queryset = QuoteTrackingLine.objects.all().order_by('id')
    serializer_class = QuoteTrackingLineSerializer
    module_name = 'quote_tracking_lines'
    filterset_fields = ['tracking']
    pagination_class = None

    @action(detail=False, methods=['POST'], url_path='reset-tracking')
    def reset_tracking(self, request):
        """Réinitialiser le suivi des modifications pour toutes les lignes d'un tracking"""
        tracking_id = request.data.get('tracking_id')
        if not tracking_id:
            return Response({'error': 'tracking_id requis'}, status=400)
        
        # Réinitialiser toutes les lignes du tracking
        lines = QuoteTrackingLine.objects.filter(tracking_id=tracking_id)
        updated_count = 0
        for line in lines:
            line.change_status = 'unchanged'
            line.original_designation = None
            line.original_quantite = None
            line.original_prix_unitaire = None
            line.save()
            updated_count += 1
        
        return Response({
            'status': 'success',
            'message': f'{updated_count} ligne(s) de tracking réinitialisée(s)',
            'updated_count': updated_count
        })

class QuoteGroupViewSet(BaseViewSet):
    queryset = QuoteGroup.objects.all()
    serializer_class = QuoteGroupSerializer
    module_name = 'quote_groups'
    filterset_fields = ['quote']
    pagination_class = None


class QuoteTrackingGroupViewSet(BaseViewSet):
    queryset = QuoteTrackingGroup.objects.all()
    serializer_class = QuoteTrackingGroupSerializer
    module_name = 'quote_tracking_groups'
    filterset_fields = ['tracking']
    pagination_class = None



