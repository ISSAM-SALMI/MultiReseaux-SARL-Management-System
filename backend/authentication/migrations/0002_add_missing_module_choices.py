# Generated migration to add missing module choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='permission',
            name='module',
            field=models.CharField(
                max_length=50,
                choices=[
                    ('auth', 'Authentication'),
                    ('dashboard', 'Dashboard'),
                    ('projects', 'Projects'),
                    ('quotes', 'Quotes'),
                    ('quote_lines', 'Quote Lines'),
                    ('quote_trackings', 'Quote Trackings'),
                    ('quote_tracking_lines', 'Quote Tracking Lines'),
                    ('quote_groups', 'Quote Groups'),
                    ('quote_tracking_groups', 'Quote Tracking Groups'),
                    ('budget', 'Budget'),
                    ('hr_estimation', 'HR Estimation'),
                    ('invoices', 'Invoices'),
                    ('documents', 'Documents'),
                    ('notifications', 'Notifications'),
                    ('clients', 'Clients'),
                ]
            ),
        ),
    ]
