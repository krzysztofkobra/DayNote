from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    COLOR_CHOICES = [
        ('event-blue', 'Blue'),
        ('event-green', 'Green'),
        ('event-orange', 'Orange'),
    ]

    title = models.CharField(max_length=100)
    date = models.DateField()
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='event-blue')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')

    def __str__(self):
        return f"{self.title} on {self.date}"

class Note(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    def __str__(self):
        return self.title

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    google_connected = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png')

    def __str__(self):
        return f"{self.user.username}'s profile"