from django.contrib.auth import logout
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from ..forms import UserProfileForm
from ..models import UserProfile, Event, Note, NoteCategory

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def account_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == "POST":
        form = UserProfileForm(request.data, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return Response({"status": "updated"})
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response({
            "username": request.user.username,
            "email": request.user.email,
            "first_name": request.user.first_name,
            "last_name": request.user.last_name,
            "profile": {
                "avatar": profile.avatar.url if profile.avatar else None,
                "google_connected": profile.google_connected
            }
        })

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def delete_account_view(request):
    if request.method == "GET":
        return Response({"message": "Please confirm account deletion."})
    elif request.method == "POST":
        confirmation = request.data.get("confirmation")
        password = request.data.get("password")

        if confirmation != "DELETE":
            return Response({"error": "Please type DELETE to confirm account deletion."}, status=400)

        if not request.user.profile.google_connected and request.user.has_usable_password():
            if not password or not request.user.check_password(password):
                return Response({"error": "Incorrect password. Please try again."}, status=400)

        user = request.user
        Event.objects.filter(user=user).delete()
        Note.objects.filter(user=user).delete()
        NoteCategory.objects.filter(user=user).delete()
        UserProfile.objects.filter(user=user).delete()

        logout(request)
        user.delete()

        return Response({"status": "account_deleted"})
