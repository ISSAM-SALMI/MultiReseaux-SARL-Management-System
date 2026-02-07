"""Add 'type' field to Employee model

This migration adds the missing 'type' column to the existing EMPLOYEES table.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0004_generalexpense'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='type',
            field=models.CharField(max_length=20, choices=[('brocoleurs', 'Brocôleurs'), ('principale', 'Principale')], default='principale'),
        ),
    ]
