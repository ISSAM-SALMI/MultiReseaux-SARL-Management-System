from django.db import models
from projects.models import Project

class Document(models.Model):
    TYPE_CHOICES = [
        ('PDF', 'PDF'),
        ('IMAGE', 'Image'),
        ('OTHER', 'Other'),
    ]

    id_document = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, default="Document")
    type_document = models.CharField(max_length=20, choices=TYPE_CHOICES, default='PDF')
    file_url = models.FileField(upload_to='documents/') # This will use the configured storage
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='documents', db_column='id_project')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'DOCUMENTS'
