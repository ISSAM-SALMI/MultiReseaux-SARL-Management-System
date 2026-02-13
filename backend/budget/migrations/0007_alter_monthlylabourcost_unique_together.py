# Generated manually to fix missing migration

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0006_monthlylabourcost'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='monthlylabourcost',
            unique_together={('year', 'month')},
        ),
    ]
