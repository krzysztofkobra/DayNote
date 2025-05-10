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
    path('settings/', views.settings_view, name='settings'),
    path('auth-receiver/', views.auth_receiver, name='auth_receiver'),
    path('accounts/profile/', views.account_view, name='account'),
    path('notes/add_note/', views.add_note, name='add_note'),
    path('notes/delete_note/', views.delete_note, name='delete_note'),
    path('notes/delete_category/', views.delete_category, name='delete_category'),
    path('notes/remove_category_from_note/', views.remove_category_from_note, name='remove_category_from_note'),
    path('notes/create_category/', views.create_category, name='create_category'),
    path('accounts/delete/', views.delete_account_view, name='delete_account'),
]