from django.db import models
from Users.models import User
from Events.models import EventData
# Create your models here.
class Registration(models.Model):

    id = models.AutoField(primary_key=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="registrations")
    event = models.ForeignKey(EventData, on_delete=models.CASCADE, related_name="registrations")
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "event")
        ordering = ["-registered_at"]

    def __str__(self):
        return f"{self.user.name} registered for {self.event.title}"