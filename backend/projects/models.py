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
    date_fin = models.DateField()
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

class ProjectWorker(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='workers')
    employee = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='project_assignments')
    worker_name = models.CharField(max_length=255, blank=True, null=True) # For temp workers
    daily_salary = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'PROJECT_WORKERS'

class ProjectWorkerAttendance(models.Model):
    STATUS_CHOICES = [
        ('PRESENT', 'Présent'),
        ('ABSENT_JUSTIFIED', 'Absent justifié'),
        ('ABSENT_UNJUSTIFIED', 'Absent injustifié'),
    ]

    worker = models.ForeignKey(ProjectWorker, on_delete=models.CASCADE, related_name='attendance')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')

    class Meta:
        db_table = 'PROJECT_WORKER_ATTENDANCE'
        unique_together = ('worker', 'date')

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

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.apps import apps
from django.db import transaction

@receiver(post_save, sender=ProjectWorkerAttendance)
def sync_absence_to_leaves(sender, instance, created, **kwargs):
    if not instance.worker.employee:
        return

    Leave = apps.get_model('payroll', 'Leave')
    SalaryPeriod = apps.get_model('payroll', 'SalaryPeriod')

    is_absent = instance.status in ['ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED']
    
    # Check if a leave for this specific day/employee already exists
    existing_leave = Leave.objects.filter(
        employee=instance.worker.employee,
        start_date=instance.date,
        end_date=instance.date
    ).first()

    if is_absent:
        leave_type = 'ABS' 
        reason = f"Absence Projet: {instance.worker.project.nom_projet} ({instance.get_status_display()})"
        
        if existing_leave:
            # Update only if it's an auto-generated absence or simple absence
            if existing_leave.type == 'ABS' and "Absence Projet" in (existing_leave.reason or ""):
                existing_leave.reason = reason
                existing_leave.save()
        else:
            period = SalaryPeriod.objects.filter(
                employee=instance.worker.employee,
                start_date__lte=instance.date,
                end_date__gte=instance.date
            ).first()

            Leave.objects.create(
                employee=instance.worker.employee,
                salary_period=period,
                start_date=instance.date,
                end_date=instance.date,
                type=leave_type,
                duration=1,
                reason=reason
            )
    else:
        # Status is PRESENT
        if existing_leave and "Absence Projet" in (existing_leave.reason or ""):
            existing_leave.delete()

@receiver(post_delete, sender=ProjectWorkerAttendance)
def delete_absence_leave(sender, instance, **kwargs):
    if not instance.worker.employee:
        return
        
    Leave = apps.get_model('payroll', 'Leave')
    
    existing_leave = Leave.objects.filter(
        employee=instance.worker.employee,
        start_date=instance.date,
        end_date=instance.date
    ).first()
    
    if existing_leave and "Absence Projet" in (existing_leave.reason or ""):
        existing_leave.delete()

