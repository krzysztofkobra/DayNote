from django.contrib import admin

from django.contrib import admin
from .models import Event, Note, UserProfile, NoteCategory

admin.site.register(Event)
admin.site.register(Note)
admin.site.register(UserProfile)
admin.site.register(NoteCategory)