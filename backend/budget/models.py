from django.db import models

class Employee(models.Model):
    id_employee = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=255)
    prenom = models.CharField(max_length=255, default='')
    telephone = models.CharField(max_length=50, blank=True, null=True)
    cin = models.CharField(max_length=50, unique=True, default='000000')
    date_debut = models.DateField(null=True, blank=True)
    salaire_semaine = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fonction = models.CharField(max_length=100, blank=True, null=True)
    # New required type field: Brocôleurs / Principale
    TYPE_CHOICES = [
        ('brocoleurs', 'Brocôleurs'),
        ('principale', 'Principale'),
    ]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='principale')

    class Meta:
        db_table = 'EMPLOYEES'

    def __str__(self):
        return f"{self.nom} {self.prenom}"

class Material(models.Model):
    id_material = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=255)
    unite = models.CharField(max_length=50)

    class Meta:
        db_table = 'MATERIALS'

    def __str__(self):
        return self.nom

class MaterialCost(models.Model):
    # id is default PK
    material = models.ForeignKey(Material, on_delete=models.CASCADE, related_name='costs', db_column='id_material')
    prix_usine = models.DecimalField(max_digits=12, decimal_places=2)
    transport = models.DecimalField(max_digits=12, decimal_places=2)
    distance = models.DecimalField(max_digits=10, decimal_places=2)
    manutention_ouvriers = models.DecimalField(max_digits=12, decimal_places=2)
    prix_ouvrier = models.DecimalField(max_digits=12, decimal_places=2)
    tu = models.DecimalField(max_digits=12, decimal_places=2) # Temps Unitaire?
    taux_perte = models.DecimalField(max_digits=5, decimal_places=2)
    vrc_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'MATERIAL_COSTS'

class GeneralExpense(models.Model):
    CATEGORY_CHOICES = [
        ('TRANSPORT', 'Transport'),
        ('FUEL', 'Carburant / Auto'),
        ('LOGISTICS', 'Logistique'),
        ('OFFICE', 'Bureau & Administratif'),
        ('OTHER', 'Autre'),
    ]

    id_expense = models.AutoField(primary_key=True)
    label = models.CharField(max_length=255, verbose_name="Libellé")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    date = models.DateField(verbose_name="Date")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='OTHER', verbose_name="Catégorie")
    description = models.TextField(blank=True, null=True, verbose_name="Observation")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'GENERAL_EXPENSES'
        ordering = ['-date']

    def __str__(self):
        return f"{self.date} - {self.label} ({self.amount})"

class MonthlyLabourCost(models.Model):
    """
    Modèle pour stocker les coûts de main-d'œuvre saisis manuellement par mois.
    Séparé des autres dépenses pour un suivi indépendant et une historisation claire.
    """
    id_labour = models.AutoField(primary_key=True)
    year = models.IntegerField(verbose_name="Année")
    month = models.IntegerField(verbose_name="Mois")  # 1-12
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant Main-d'œuvre")
    description = models.TextField(blank=True, null=True, verbose_name="Note / Détails")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'MONTHLY_LABOUR_COSTS'
        ordering = ['-year', '-month']
        unique_together = [['year', 'month']]  # Une seule entrée par mois
        verbose_name = "Coût Main-d'œuvre Mensuel"
        verbose_name_plural = "Coûts Main-d'œuvre Mensuels"

    def __str__(self):
        months = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
        month_name = months[self.month] if 1 <= self.month <= 12 else str(self.month)
        return f"{month_name} {self.year} - {self.amount} MAD"
