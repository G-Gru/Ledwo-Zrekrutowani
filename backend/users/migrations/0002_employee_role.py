from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='role',
            field=models.CharField(
                blank=True,
                choices=[
                    ('ADMINISTRATIVE_COORDINATOR', 'Koordynator administracyjny'),
                    ('FINANCE_COORDINATOR', 'Koordynator finansowy'),
                    ('STUDIES_DIRECTOR', 'Kierownik studiów'),
                ],
                max_length=50,
            ),
        ),
    ]
