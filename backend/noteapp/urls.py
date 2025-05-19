from django.urls import path
from .views import account_views, calendar_views, auth_views, note_views, settings_views


urlpatterns = [
    path('', calendar_views.calendar_view, name='home'),
    path('add-event/', calendar_views.add_event, name='add_event'),
    path('delete-event/', calendar_views.delete_event, name='delete_event'),

    path('settings/', settings_views.settings_view, name='settings'),

    path('login/', auth_views.login_view, name='login'),
    path('logout/', auth_views.logout_view, name='logout'),
    path('register/', auth_views.register_view, name='register'),

    path('accounts/profile/', account_views.account_view, name='account'),
    path('accounts/delete/', account_views.delete_account_view, name='delete_account'),

    path('notes/', note_views.notes_view, name='notes'),
    path('notes/note/', note_views.add_or_update_note, name='add_note'),
    path('notes/note/<int:note_id>/', note_views.add_or_update_note, name='update_note'),
    path('notes/note/<int:note_id>/delete/', note_views.delete_note, name='delete_note'),
    path('notes/category/', note_views.create_category, name='create_category'),
    path('notes/category/<int:category_id>/delete/', note_views.delete_category, name='delete_category'),
    path('notes/note/<int:note_id>/remove_category/', note_views.remove_category_from_note, name='remove_category_from_note'),
    path('notes/autocategorize/', note_views.autocategorize_all_notes, name='autocategorize_all_notes'),
]