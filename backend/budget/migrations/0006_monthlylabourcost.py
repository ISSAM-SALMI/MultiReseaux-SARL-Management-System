# Generated migration for MonthlyLabourCost model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budget', '0005_add_type_field'),
    ]

    operations = [
        migrations.CreateModel(
            name='MonthlyLabourCost',
            fields=[
                ('id_labour', models.AutoField(primary_key=True, serialize=False)),
                ('year', models.IntegerField(verbose_name='Année')),
                ('month', models.IntegerField(verbose_name='Mois')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12, verbose_name='Montant Main-d\'œuvre')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Note / Détails')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Coût Main-d\'œuvre Mensuel',
                'verbose_name_plural': 'Coûts Main-d\'œuvre Mensuels',
                'db_table': 'MONTHLY_LABOUR_COSTS',
                'ordering': ['-year', '-month'],
            },
        ),
        migrations.AddConstraint(
            model_name='monthlylabourcost',
            constraint=models.UniqueConstraint(fields=['year', 'month'], name='unique_year_month'),
        ),
    ]
