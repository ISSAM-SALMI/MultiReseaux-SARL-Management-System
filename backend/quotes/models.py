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
    CHANGE_STATUS_CHOICES = [
        ('unchanged', 'Inchangé'),
        ('modified', 'Modifié'),
        ('new', 'Nouveau'),
    ]
    
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
    
    # Champs pour le suivi visuel des modifications
    change_status = models.CharField(
        max_length=20, 
        choices=CHANGE_STATUS_CHOICES, 
        default='unchanged',
        help_text="Statut de modification pour suivi visuel"
    )
    original_designation = models.CharField(max_length=255, blank=True, null=True)
    original_quantite = models.IntegerField(blank=True, null=True)
    original_prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'QUOTE_LINES'

    def save(self, *args, **kwargs):
        # Détecter les modifications pour le suivi visuel
        if self.pk:  # Si la ligne existe déjà
            try:
                old_line = QuoteLine.objects.get(pk=self.pk)
                # Vérifier si des champs ont changé
                if (old_line.designation != self.designation or 
                    old_line.quantite != self.quantite or 
                    old_line.prix_unitaire != self.prix_unitaire):
                    # Marquer comme modifié et sauvegarder les valeurs originales si pas déjà fait
                    if self.change_status == 'unchanged':
                        self.change_status = 'modified'
                        self.original_designation = old_line.designation
                        self.original_quantite = old_line.quantite
                        self.original_prix_unitaire = old_line.prix_unitaire
            except QuoteLine.DoesNotExist:
                pass
        
        # Le statut 'new' pour les nouvelles lignes doit être défini explicitement
        # avant l'appel à save() si nécessaire (par exemple via l'API de suivi).
        # Sinon, la valeur par défaut 'unchanged' est utilisée.
        
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

class QuoteTrackingGroup(models.Model):
    """Groupe/Section pour organiser les lignes de suivi de devis"""
    tracking = models.ForeignKey(QuoteTracking, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'QUOTE_TRACKING_GROUPS'
        ordering = ['order', 'id']

    def __str__(self):
        return f"Tracking {self.tracking.id} - {self.name}"

    def get_total(self):
        """Calcule le total HT des lignes du groupe"""
        return sum(line.montant_ht for line in self.lines.all())


class QuoteTrackingLine(models.Model):
    CHANGE_STATUS_CHOICES = [
        ('unchanged', 'Inchangé'),
        ('modified', 'Modifié'),
        ('new', 'Nouveau'),
    ]
    
    tracking = models.ForeignKey(QuoteTracking, on_delete=models.CASCADE, related_name='lines', db_column='id_tracking')
    group = models.ForeignKey(
        QuoteTrackingGroup, 
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
    
    # Champs pour le suivi visuel des modifications
    change_status = models.CharField(
        max_length=20, 
        choices=CHANGE_STATUS_CHOICES, 
        default='unchanged',
        help_text="Statut de modification pour suivi visuel"
    )
    original_designation = models.CharField(max_length=255, blank=True, null=True)
    original_quantite = models.IntegerField(blank=True, null=True)
    original_prix_unitaire = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'QUOTE_TRACKING_LINES'

    def save(self, *args, **kwargs):
        # Détecter les modifications pour le suivi visuel
        if self.pk:  # Si la ligne existe déjà
            try:
                old_line = QuoteTrackingLine.objects.get(pk=self.pk)
                # Vérifier si des champs ont changé
                if (old_line.designation != self.designation or 
                    old_line.quantite != self.quantite or 
                    old_line.prix_unitaire != self.prix_unitaire):
                    # Marquer comme modifié et sauvegarder les valeurs originales si pas déjà fait
                    if self.change_status == 'unchanged':
                        self.change_status = 'modified'
                        self.original_designation = old_line.designation
                        self.original_quantite = old_line.quantite
                        self.original_prix_unitaire = old_line.prix_unitaire
            except QuoteTrackingLine.DoesNotExist:
                pass
        
        # Le statut 'new' doit être renseigné explicitement pour les nouvelles lignes
        # de tracking (ajoutées après la copie initiale).
        # La copie initiale utilisera la valeur par défaut 'unchanged'.
        
        self.montant_ht = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

