from celery import shared_task
from .models import Quote
# import weasyprint # Uncomment when installed and needed

@shared_task
def generate_quote_pdf(quote_id):
    try:
        quote = Quote.objects.get(id=quote_id)
        # Logic to generate PDF
        # html = render_to_string('quotes/pdf_template.html', {'quote': quote})
        # pdf = weasyprint.HTML(string=html).write_pdf()
        # Save pdf to storage and update quote or send email
        print(f"Generating PDF for quote {quote_id}")
        return f"PDF generated for quote {quote_id}"
    except Quote.DoesNotExist:
        return "Quote not found"
