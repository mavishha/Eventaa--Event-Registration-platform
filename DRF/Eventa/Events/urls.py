# from django.urls import path
# from Events import views

# urlpatterns = [
#     path('',views.displayEvent,name='displayEvent')
# ]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from Events.views import EventDetailsView,EventListView

router = DefaultRouter()
router.register(r'events', EventListView,basename='events')
router.register(r'details', EventDetailsView,basename='events-details')

urlpatterns = [
    path('', include(router.urls)),
]


