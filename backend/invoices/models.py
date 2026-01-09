from django.db import models
from projects.models import Project

class Invoice(models.Model):
    id_invoice = models.AutoField(primary_key=True)
    date = models.DateField()
    fournisseur = models.CharField(max_length=255)
    montant = models.DecimalField(max_digits=12, decimal_places=2)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='invoices', db_column='id_project')

    class Meta:
        db_table = 'INVOICES'
