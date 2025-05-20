from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt

from ..models import UserProfile
from ..forms import RegisterForm

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import json

@api_view(['POST'])
@permission_classes([AllowAny])
def auth_receiver(request):
    try:
        token = request.data.get('credential')
        if not token:
            return Response({'error': 'No credential token found'}, status=400)

        client_id = settings.GOOGLE_OAUTH_CLIENT_ID
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id, clock_skew_in_seconds=10)
        email = idinfo['email']
        name = idinfo.get('name', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            username = email.split('@')[0]
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(username=username, email=email, password=None)

        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.google_connected = True
        profile.save()

        login(request, user)
        return Response({'status': 'ok'})

    except ValueError as e:
        return Response({'error': f'Invalid token: {str(e)}'}, status=403)
    except Exception as e:
        return Response({'error': f'Authentication error: {str(e)}'}, status=403)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    form = RegisterForm(request.data)
    if form.is_valid():
        username = form.cleaned_data.get("username")
        password = form.cleaned_data.get("password")
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return Response({'status': 'ok'})
    return Response({'errors': form.errors}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user:
        login(request, user)
        return Response({'status': 'ok'})
    return Response({'error': 'Invalid credentials'}, status=401)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({'status': 'ok'})
