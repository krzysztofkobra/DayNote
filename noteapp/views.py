from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.contrib.auth.models import User
from .forms import RegisterForm
from .models import Event, Note, UserProfile
import calendar
from datetime import datetime, date
from calendar import monthrange
from google.oauth2 import id_token
from google.auth.transport import requests
from django.http import HttpResponse
import os
from dotenv import load_dotenv

def sign_in(request):
    return render(request, 'accounts/login.html')


def auth_receiver(request):
    if request.method == 'POST':
        try:
            token = request.POST.get('credential')

            load_dotenv()
            client_id = os.getenv("GOOGLE_CLIENT_ID")
            
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)

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
            else:
                profile, created = UserProfile.objects.get_or_create(user=user)
                profile.google_connected = True
                profile.save()

            # Login the user
            login(request, user)
            return redirect('home')

        except ValueError:
            return HttpResponse('Invalid token', status=403)

    return HttpResponse('Method not allowed', status=405)

def sign_out(request):
    del request.session['user_data']
    return redirect('login')

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
def account_view(request):
    pass

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

    # Redirect back to the calendar view
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
    return render(request, 'noteapp/notes.html', {'notes': notes})

@login_required
def add_note(request):
    if request.method == 'POST':
        note_id = request.POST.get('note_id')
        title = request.POST.get('title')
        content = request.POST.get('content')

        if note_id:
            try:
                note = Note.objects.get(id=note_id, user=request.user)
                note.title = title
                note.content = content
                note.save()
            except Note.DoesNotExist:
                pass
        else:
            Note.objects.create(
                title=title,
                content=content,
                user=request.user
            )

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