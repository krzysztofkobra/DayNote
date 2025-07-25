from rest_framework import serializers
from .models import Event, Note, NoteCategory, UserProfile

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ["id", "title", "date", "color", "start_time", "end_time"]

class NoteCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NoteCategory
        fields = ["id", "name", "color"]

class NoteSerializer(serializers.ModelSerializer):
    category = NoteCategorySerializer(read_only=True)
    class Meta:
        model = Note
        fields = ["id", "title", "content", "category", "updated_at"]

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'google_connected']