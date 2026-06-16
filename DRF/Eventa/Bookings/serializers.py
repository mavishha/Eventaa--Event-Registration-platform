from rest_framework import serializers
from Bookings.models import Registration
from Events.serializers import EventSerializer

class MyRegistrationSerializer(serializers.ModelSerializer):

    event = EventSerializer(read_only=True)

    class Meta:
        model = Registration
        fields = ("id", "event", "registered_at")


class RegisterEventSerializer(serializers.ModelSerializer):
 
    class Meta:
        model = Registration
        fields = ("id", "registered_at")

    def create(self, validated_data):
        user = self.context["request"].user
        event = self.context["event"]
        
        
        if Registration.objects.filter(user=user, event=event).exists():
            raise serializers.ValidationError({"detail": "You are already registered for this event."})
            
        registration = Registration.objects.create(
            user=user,
            event=event
        )
        return registration

