from django.db import models

def file_upload_path(instance, filename):
    return f"{instance.source.lower()}/{filename}"

class File(models.Model):
    class Source(models.TextChoices):
        SUBMITTED = 'SUBMITTED'
        PAYMENT = 'PAYMENT'

    file = models.FileField(upload_to=file_upload_path)
    source = models.CharField(choices=Source.choices)
    created_at = models.DateTimeField(auto_now_add=True)

