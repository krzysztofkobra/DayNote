from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.contrib.auth.models import User
from django.conf import settings
from django.http import HttpResponse

from .forms import RegisterForm, UserProfileForm
from .models import Event, Note, UserProfile, NoteCategory
from .services import categorize_note_content, NoteCategorizer, recategorize_all_notes

import calendar
from datetime import datetime, date
from calendar import monthrange

from google.oauth2 import id_token
from google.auth.transport import requests

import json


@csrf_exempt
def auth_receiver(request):
    if request.method == 'POST':
        try:
            token = request.POST.get('credential')
            if not token:
                try:
                    data = json.loads(request.body.decode('utf-8'))
                    token = data.get('credential')
                except:
                    pass

            if not token:
                return HttpResponse('No credential token found', status=400)

            client_id = settings.GOOGLE_OAUTH_CLIENT_ID

            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                client_id,
                clock_skew_in_seconds=10
            )

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

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=None
                )

            profile, created = UserProfile.objects.get_or_create(user=user)
            profile.google_connected = True
            profile.save()

            login(request, user)
            return redirect('home')

        except ValueError as e:
            return HttpResponse(f'Invalid token: {str(e)}', status=403)
        except Exception as e:
            return HttpResponse(f'Authentication error: {str(e)}', status=403)

    return HttpResponse('Method not allowed', status=405)

def register_view(request):
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data.get("username")
            password = form.cleaned_data.get("password")
            user = User.objects.create_user(username=username, password=password)
            login(request, user)
            return redirect('home')
    else:
        form = RegisterForm()
    return render(request, 'accounts/register.html', {'form': form})

def login_view(request):
    error_message = None
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.POST.get('next') or request.GET.get('next') or 'home'
            return redirect(next_url)
        else:
            error_message = "Invalid Credentials!"
    return render(request, 'accounts/login.html', {'error': error_message})

def logout_view(request):
    if request.method == "POST":
        logout(request)
        return redirect('login')
    else:
        return render(request, 'accounts/logout.html')

@login_required
def delete_account_view(request):
    if request.method == 'GET':
        return render(request, 'accounts/delete_account.html')

    elif request.method == 'POST':
        confirmation = request.POST.get('confirmation')
        password = request.POST.get('password')

        if confirmation != 'DELETE':
            return render(request, 'accounts/delete_account.html', {
                'error': 'Please type DELETE to confirm account deletion.'
            })

        if not request.user.profile.google_connected and request.user.has_usable_password():
            if not password:
                return render(request, 'accounts/delete_account.html', {
                    'error': 'Please enter your password to confirm account deletion.'
                })

            if not request.user.check_password(password):
                return render(request, 'accounts/delete_account.html', {
                    'error': 'Incorrect password. Please try again.'
                })

        user = request.user

        Event.objects.filter(user=user).delete()
        Note.objects.filter(user=user).delete()
        NoteCategory.objects.filter(user=user).delete()

        try:
            profile = UserProfile.objects.get(user=user)
            profile.delete()
        except UserProfile.DoesNotExist:
            pass

        logout(request)

        user.delete()

        return render(request, 'accounts/account_deleted.html')

@login_required
def calendar_view(request):
    today = datetime.now()
    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))

    month_name = calendar.month_name[month]

    _, num_days = monthrange(year, month)

    first_day, _ = monthrange(year, month)

    first_day = (first_day + 1) % 7

    if month == 1:
        prev_month_year = year - 1
        prev_month = 12
    else:
        prev_month_year = year
        prev_month = month - 1

    _, prev_month_days = monthrange(prev_month_year, prev_month)

    start_date = date(prev_month_year, prev_month, prev_month_days - first_day + 1) if first_day > 0 else date(year, month, 1)

    if month == 12:
        next_month_year = year + 1
        next_month = 1
    else:
        next_month_year = year
        next_month = month + 1

    remaining_days = 42 - (first_day + num_days)
    end_date = date(next_month_year, next_month, remaining_days) if remaining_days > 0 else date(year, month, num_days)

    if request.user.is_authenticated:
        events = Event.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        ).order_by('date')
    else:
        events = []

    event_dict = {}
    for event in events:
        event_date = event.date.strftime('%Y-%m-%d')
        if event_date not in event_dict:
            event_dict[event_date] = []
        event_dict[event_date].append({
            'id': event.id,
            'title': event.title,
            'date': event_date,
            'color': event.color
        })

    calendar_days = []

    for i in range(first_day):
        day_number = prev_month_days - first_day + i + 1
        full_date = date(prev_month_year, prev_month, day_number)
        day_events = event_dict.get(full_date.strftime('%Y-%m-%d'), [])

        calendar_days.append({
            'number': day_number,
            'full_date': full_date,
            'current_month': False,
            'is_today': False,
            'events': day_events
        })

    for i in range(1, num_days + 1):
        full_date = date(year, month, i)
        is_today = (i == today.day and month == today.month and year == today.year)
        day_events = event_dict.get(full_date.strftime('%Y-%m-%d'), [])

        calendar_days.append({
            'number': i,
            'full_date': full_date,
            'current_month': True,
            'is_today': is_today,
            'events': day_events
        })

    for i in range(1, remaining_days + 1):
        full_date = date(next_month_year, next_month, i)
        day_events = event_dict.get(full_date.strftime('%Y-%m-%d'), [])

        calendar_days.append({
            'number': i,
            'full_date': full_date,
            'current_month': False,
            'is_today': False,
            'events': day_events
        })

    context = {
        'calendar_days': calendar_days,
        'month_name': month_name,
        'year': year,
        'month': month,
    }

    return render(request, 'noteapp/home.html', context)

@login_required
def add_event(request):
    if request.method == 'POST':
        event_id = request.POST.get('event_id')
        title = request.POST.get('title')
        date_str = request.POST.get('date')
        color = request.POST.get('color')

        event_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        if event_id:
            try:
                event = Event.objects.get(id=event_id, user=request.user)
                event.title = title
                event.date = event_date
                event.color = color
                event.save()
            except Event.DoesNotExist:
                pass
        else:
            Event.objects.create(
                title=title,
                date=event_date,
                color=color,
                user=request.user
            )

    return redirect(reverse('home'))

@login_required
def delete_event(request):
    event_id = request.GET.get('event_id')

    if event_id:
        try:
            event = Event.objects.get(id=event_id, user=request.user)
            event.delete()
        except Event.DoesNotExist:
            pass

    return redirect(reverse('home'))

@login_required
def notes_view(request):
    notes = Note.objects.filter(user=request.user).order_by('-updated_at')
    categories = NoteCategory.objects.filter(user=request.user)
    return render(request, 'noteapp/notes.html', {'notes': notes, 'categories': categories})

@login_required
def add_note(request):
    if request.method == 'POST':
        note_id = request.POST.get('note_id')
        title = request.POST.get('title')
        content = request.POST.get('content')
        category_id = request.POST.get('category')
        new_category_name = request.POST.get('new_category_name')
        new_category_color = request.POST.get('new_category_color')

        if category_id == 'new' and new_category_name:
            category = NoteCategory.objects.create(
                name=new_category_name,
                color=new_category_color,
                user=request.user
            )
        elif category_id:
            category = NoteCategory.objects.get(id=category_id)
        else:
            category = None

        if note_id:
            note = get_object_or_404(Note, id=note_id, user=request.user)
            note.title = title
            note.content = content
            note.category = category
            note.save()
        else:
            note = Note.objects.create(
                title=title,
                content=content,
                category=category,
                user=request.user
            )

        # if category is None:
        #     result = categorize_note_content(content)
        #     cat_name = result.get('category', 'Uncategorized')
        #     cat_obj, _ = NoteCategory.objects.get_or_create(
        #         name=cat_name,
        #         user=request.user,
        #         defaults={'color': '#cccccc'}
        #     )
        #     note.category = cat_obj
        #     note.save(update_fields=['category'])

    return redirect(reverse('notes'))

@login_required
def delete_note(request):
    note_id = request.GET.get('note_id')

    if note_id:
        try:
            note = Note.objects.get(id=note_id, user=request.user)
            note.delete()
        except Note.DoesNotExist:
            pass

    return redirect(reverse('notes'))


@login_required
def account_view(request):
    profile, created = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "POST":
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('account')
    else:
        form = UserProfileForm(instance=profile)

    context = {
        'form': form,
        'profile': profile,
    }
    return render(request, 'accounts/account.html', context)


@login_required
def create_category(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        color = request.POST.get('color')
        if name and color:
            NoteCategory.objects.create(name=name, color=color, user=request.user)
    return redirect(reverse('notes'))

@login_required
def delete_category(request):
    category_id = request.GET.get('category_id')

    if category_id:
        try:
            category = NoteCategory.objects.get(id=category_id, user=request.user)

            Note.objects.filter(category=category, user=request.user).update(category=None)

            category.delete()
        except NoteCategory.DoesNotExist:
            pass

    return redirect(reverse('notes'))


@login_required
def remove_category_from_note(request):
    note_id = request.GET.get('note_id')

    if note_id:
        try:
            note = Note.objects.get(id=note_id, user=request.user)
            note.category = None
            note.save()
        except Note.DoesNotExist:
            pass

    return redirect(reverse('notes'))


@login_required
def autocategorize_all_notes(request):
    user = request.user
    categorizer = NoteCategorizer(user)
    notes = Note.objects.filter(user=user)
    for note in notes:
        if note.category is None:
            result = categorizer.categorize_note(note.content)
            if result["category"]:
                cat = categorizer.batch_categorize([note])[0].category
                if cat:
                    note.category = cat
                    note.save(update_fields=["category"])
    return redirect(reverse('notes'))

@login_required
def settings_view(request):
    return render(request, 'noteapp/settings.html')