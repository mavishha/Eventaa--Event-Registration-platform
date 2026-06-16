from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

from rest_framework import viewsets,permissions
from Events.models import EventData
from Events.serializers import EventSerializer
#from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

def displayEvent(request):
    return HttpResponse("display events")


class EventListView(viewsets.ModelViewSet):
    queryset = EventData.objects.all().order_by("date")
    serializer_class = EventSerializer
    permission_classes=[permissions.AllowAny]

class EventDetailsView(viewsets.ModelViewSet):
    queryset=EventData.objects.all()
    serializer_class = EventSerializer
    permission_classes=[permissions.AllowAny]

