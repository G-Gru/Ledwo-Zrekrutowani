from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel('Fees', 'Fee'),
        migrations.RenameModel('Payments', 'Payment'),
        migrations.RenameModel('PaymentsHistory', 'PaymentHistory'),
    ]