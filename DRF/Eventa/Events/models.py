from django.db import models

# Create your models here.
class EventData(models.Model):
    id = models.AutoField(primary_key=True, editable=False)
    title=models.CharField(max_length=200)
    description = models.TextField()
    date=models.DateField()
    location=models.CharField(max_length=200)
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title