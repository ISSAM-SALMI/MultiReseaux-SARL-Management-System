from django.db import models

class Client(models.Model):
    TYPE_CHOICES = [
        ('PARTICULIER', 'Particulier'),
        ('ENTREPRISE', 'Entreprise'),
    ]
    STATUS_CHOICES = [
        ('ACTIF', 'Actif'),
        ('INACTIF', 'Inactif'),
    ]

    id_client = models.AutoField(primary_key=True)
    nom_client = models.CharField(max_length=255)
    type_client = models.CharField(max_length=20, choices=TYPE_CHOICES, default='ENTREPRISE')
    telephone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, blank=True, null=True)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIF')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'CLIENTS'

    def __str__(self):
        return self.nom_client
