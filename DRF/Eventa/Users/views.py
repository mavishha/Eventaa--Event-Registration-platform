from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.shortcuts import get_object_or_404

from Users.models import User
from Users.serializers import (
    UserSerializer,
    RegisterSerializer,
   
)

class RegisterView(generics.CreateAPIView):

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "message": "User registered successfully",
            "token": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class CustomLoginView(TokenObtainPairView):

    permission_classes = (permissions.AllowAny,)

    def post(self, request, *args, **kwargs):

        if "email" in request.data and "username" not in request.data:
            data = request.data.copy()
            data["username"] = data["email"]
            
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            
            user = User.objects.get(email=request.data.get("email"))
            response.data["user"] = UserSerializer(user).data
            
            response.data["token"] = response.data.get("access")
            
        return response