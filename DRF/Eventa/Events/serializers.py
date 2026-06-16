#to convert data obj into json and json to data obj
from rest_framework import serializers
from Events.models import EventData
 
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventData
        fields = ['id', 'title', 'description', 'date', 'location', 'created_at']
        