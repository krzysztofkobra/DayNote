from django.urls import path
from . import views

urlpatterns = [
    path('', views.calendar_view, name='home'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('add-event/', views.add_event, name='add_event'),
    path('delete-event/', views.delete_event, name='delete_event'),
    path('notes/', views.notes_view, name='notes'),
]