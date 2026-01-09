from django.db import models
from projects.models import Project

class Quote(models.Model):
    id_quote = models.AutoField(primary_key=True)
    numero_devis = models.CharField(max_length=50, unique=True)
    objet = models.CharField(max_length=255)
    date_livraison = models.DateField()
    tva = models.DecimalField(max_digits=5, decimal_places=2, default=20.00)
    total_ht = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_ttc = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='quotes', db_column='id_project')

    class Meta:
        db_table = 'QUOTES'

    def calculate_totals(self):
        lines = self.lines.all()
        self.total_ht = sum(line.montant_ht for line in lines)
        self.total_ttc = self.total_ht * (1 + self.tva / 100)
        self.save()

class QuoteLine(models.Model):
    # id is default PK
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='lines', db_column='id_quote')
    designation = models.CharField(max_length=255)
    quantite = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'QUOTE_LINES'

    def save(self, *args, **kwargs):
        self.montant_ht = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)
        self.quote.calculate_totals()

class QuoteTracking(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='trackings', db_column='id_quote')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'QUOTE_TRACKING'

class QuoteTrackingLine(models.Model):
    tracking = models.ForeignKey(QuoteTracking, on_delete=models.CASCADE, related_name='lines', db_column='id_tracking')
    designation = models.CharField(max_length=255)
    quantite = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2)
    montant_ht = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'QUOTE_TRACKING_LINES'

    def save(self, *args, **kwargs):
        self.montant_ht = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

