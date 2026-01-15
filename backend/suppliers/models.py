from django.db import models

class Supplier(models.Model):
    TYPE_CHOICES = [
        ('GRAND', 'Grand Fournisseur'),
        ('PETIT', 'Petit Fournisseur'),
    ]

    id_supplier = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    type_supplier = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PETIT')
    
    # Coordonnées
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)

    # Identifiants Légaux
    ice = models.CharField(max_length=20, blank=True, null=True, help_text="Identifiant Commun de l'Entreprise")
    rc = models.CharField(max_length=50, blank=True, null=True, help_text="Registre de Commerce")
    patente = models.CharField(max_length=50, blank=True, null=True)
    cnss = models.CharField(max_length=50, blank=True, null=True)
    if_fiscal = models.CharField(max_length=50, blank=True, null=True, help_text="Identifiant Fiscal")

    # Autres
    category = models.CharField(max_length=100, blank=True, null=True, help_text="Secteur ou catégorie de produits")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'SUPPLIERS'
        ordering = ['name']

    def __str__(self):
        return self.name

class SupplierInvoice(models.Model):
    STATUS_CHOICES = [
        ('PAYE', 'Payée'),
        ('IMPAYE', 'Impayée'),
    ]

    id_invoice = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='invoices')
    date = models.DateField(help_text="Date d'achat")
    amount = models.DecimalField(max_digits=12, decimal_places=2, help_text="Montant TTC")
    reference = models.CharField(max_length=100, blank=True, null=True, help_text="Numéro de facture ou référence")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PAYE')
    description = models.TextField(blank=True, null=True, help_text="Description des produits/services")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'SUPPLIER_INVOICES'
        ordering = ['-date']

    def __str__(self):
        return f"{self.supplier.name} - {self.amount} - {self.date}"
