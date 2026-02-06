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

class QuoteGroup(models.Model):
    """Groupe/Section pour organiser les lignes de devis"""
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'QUOTE_GROUPS'
        ordering = ['order', 'id']

    def __str__(self):
        return f"{self.quote.numero_devis} - {self.name}"

    def get_total(self):
        """Calcule le total HT des lignes du groupe"""
        return sum(line.montant_ht for line in self.lines.all())


class QuoteLine(models.Model):
    # id is default PK
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='lines', db_column='id_quote')
    group = models.ForeignKey(
        QuoteGroup, 
        on_delete=models.SET_NULL, 
        related_name='lines',
        null=True,
        blank=True,
        help_text="Groupe optionnel pour organiser les lignes"
    )
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
    bl_number = models.CharField(max_length=50, blank=True, null=True, help_text="Numéro du Bon de Livraison")
    bc_number = models.CharField(max_length=50, blank=True, null=True, help_text="Numéro du Bon de Commande")
    invoice_number = models.CharField(max_length=50, blank=True, null=True, help_text="Numéro de Facture")
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

