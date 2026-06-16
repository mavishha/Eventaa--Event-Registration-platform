#from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def index(request):
    return HttpResponse("Hello, Geeks! Welcome to your first Django app.")

from rest_framework import viewsets, status,generics
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from Bookings.serializers import RegisterEventSerializer,MyRegistrationSerializer
from Bookings.models import Registration


class EventRegisterView(generics.CreateAPIView):
    
    serializer_class = RegisterEventSerializer
    permission_classes = (IsAuthenticated,)

    def post(self, request, id, *args, **kwargs):
        event = get_object_or_404(Event, id=id)
        serializer = self.get_serializer(
            data=request.data, 
            context={"request": request, "event": event}
        )
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()
        
        return Response({
            "message": "Successfully registered for this event.",
            "registration": {
                "id": registration.id,
                "registered_at": registration.registered_at
            }
        }, status=status.HTTP_201_CREATED)


class MyRegisterView(generics.ListAPIView):
    serializer_class = MyRegistrationSerializer
    permission_classes=[IsAuthenticated]
    def get_queryset(self):
        return Registration.objects.filter(user=self.request.user)