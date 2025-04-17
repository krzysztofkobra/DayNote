from django.db import models
from django.contrib.auth.models import User
import datetime

class Event(models.Model):
    COLOR_CHOICES = [
        ('event-blue', 'Blue'),
        ('event-green', 'Green'),
        ('event-orange', 'Orange'),
    ]

    title = models.CharField(max_length=100)
    date = models.DateField()
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='event-blue')
    start_time = models.TimeField(default=datetime.time(0, 1))
    end_time = models.TimeField(default=datetime.time(23, 59))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')

    def __str__(self):
        return f"{self.title} on {self.date}"

class NoteCategory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default="#FFFFFF")  # HEX

    def __str__(self):
        return self.name

    class Meta:
        unique_together = ('user', 'name')

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    category = models.ForeignKey(NoteCategory, on_delete=models.SET_NULL, null=True, blank=True, default=None, related_name='notes')

    def __str__(self):
        return self.title

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    google_connected = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.jpg')

    def __str__(self):
        return f"{self.user.username}'s profile"