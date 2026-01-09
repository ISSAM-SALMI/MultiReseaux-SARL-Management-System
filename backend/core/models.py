from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
    ]

    id_log = models.AutoField(primary_key=True)
    table_name = models.CharField(max_length=100)
    record_id = models.CharField(max_length=100)
    action = models.CharField(max_length=10, choices=ACTION_CHOICES)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, db_column='id_user')
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True) # Extra info about what changed

    class Meta:
        db_table = 'AUDIT_LOGS'
