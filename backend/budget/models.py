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
