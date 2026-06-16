from django.urls import path
from Users.views import (
    RegisterView,
    CustomLoginView,

)

urlpatterns = [
    # Authentication Endpoints
    path("register", RegisterView.as_view(), name="auth-register"),
    path("login", CustomLoginView.as_view(), name="auth-login"),
]