from django.db import models
from clients.models import Client
from budget.models import Employee

class Project(models.Model):
    STATUS_CHOICES = [
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
        ('EN_ATTENTE', 'En attente'),
    ]

    id_project = models.AutoField(primary_key=True)
    nom_projet = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    date_debut = models.DateField()
    date_fin = models.DateField(blank=True, null=True)
    etat_projet = models.CharField(max_length=20, choices=STATUS_CHOICES, default='EN_ATTENTE')
    
    BILLING_STATUS_CHOICES = [
        ('NON_FACTURE', 'Non facturé'),
        ('EN_COURS', 'En cours'),
        ('FACTURE', 'Facturé'),
    ]
    billing_status = models.CharField(max_length=20, choices=BILLING_STATUS_CHOICES, default='NON_FACTURE', verbose_name="Statut de facturation")
    
    budget_total = models.DecimalField(max_digits=15, decimal_places=2)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects', db_column='id_client')
    chef_projet = models.CharField(max_length=255, blank=True, null=True) # Or ForeignKey to User/Employee

    class Meta:
        db_table = 'PROJECTS'

    def __str__(self):
        return self.nom_projet

class ProjectHR(models.Model):
    # id is default PK
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='hr_resources', db_column='id_project')
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_column='id_employee')
    nbr_salaries = models.IntegerField(default=1)
    taux_affectation = models.DecimalField(max_digits=5, decimal_places=2) # Percentage
    duree_mois = models.DecimalField(max_digits=5, decimal_places=2)
    nbr_jours_mois = models.DecimalField(max_digits=5, decimal_places=2)
    salaire_journalier = models.DecimalField(max_digits=10, decimal_places=2)
    cout_partiel = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'PROJECT_HR'

class ProjectCost(models.Model):
    # id is default PK
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='costs', db_column='id_project')
    type_cout = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    date_calcul = models.DateField(auto_now_add=True)

    class Meta:
        db_table = 'PROJECT_COSTS'

class Revenue(models.Model):
    id_revenue = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='revenues', db_column='id_project')
    avance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    montant_en_cours = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    class Meta:
        db_table = 'REVENUES'


class Expense(models.Model):
    id_expense = models.AutoField(primary_key=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses', db_column='id_project')
    date_debut = models.DateField()
    date_fin = models.DateField()
    sous_categorie = models.CharField(max_length=100)
    montant = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'EXPENSES'

