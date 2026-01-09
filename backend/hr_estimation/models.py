from django.db import models

class EstimationRow(models.Model):
    fonction = models.CharField(max_length=255)
    nbr_salaries = models.IntegerField(default=1)
    taux_affectation = models.FloatField(default=100.0)
    duree_travail_mois = models.FloatField(default=1.0)
    jours_par_mois = models.IntegerField(default=26)
    salaire_journalier = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'HR_ESTIMATION_ROWS'

