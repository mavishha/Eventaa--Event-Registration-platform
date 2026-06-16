from django.urls import path
from Bookings import views

urlpatterns = [
    path('bookings/', views.index, name='index'),
]

from django.urls import path, include
# Event Registration
path("events/<id>/register", views.EventRegisterView.as_view(), name="event-register"),
path("my-registrations",views.MyRegisterView.as_view(), name="my-registrations"),

