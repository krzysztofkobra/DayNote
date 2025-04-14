from django.shortcuts import render, redirect
from django.contrib.auth import  authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views import View
from django.contrib.auth.models import User
from .forms import RegisterForm
import calendar
from datetime import datetime, timedelta
from calendar import monthrange

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
    return render(request, 'accounts/register.html', {'form':form})

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
    return render(request, 'accounts/login.html', {'error':error_message})

def logout_view(request):
    if request.method == "POST":
        logout(request)
        return redirect('login')
    else:
        return redirect('home')


@login_required
def calendar_view(request):
    # Get the requested year and month, or use current date
    today = datetime.now()
    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))

    # Get month name
    month_name = calendar.month_name[month]

    # Get the number of days in the month
    _, num_days = monthrange(year, month)

    # Determine the first day of the month (0 = Monday, 6 = Sunday in Python's calendar)
    first_day, _ = monthrange(year, month)

    # Adjust to make Sunday = 0 (since our calendar view starts with Sunday)
    first_day = (first_day + 1) % 7

    # Get days from previous month to fill calendar
    if month == 1:
        prev_month_year = year - 1
        prev_month = 12
    else:
        prev_month_year = year
        prev_month = month - 1

    _, prev_month_days = monthrange(prev_month_year, prev_month)

    # Calculate date range for events query
    start_date = date(prev_month_year, prev_month, prev_month_days - first_day + 1) if first_day > 0 else date(year,
                                                                                                               month, 1)

    if month == 12:
        next_month_year = year + 1
        next_month = 1
    else:
        next_month_year = year
        next_month = month + 1

    # Calculate remaining days for next month
    remaining_days = 42 - (first_day + num_days)
    end_date = date(next_month_year, next_month, remaining_days) if remaining_days > 0 else date(year, month, num_days)

    # Get all events for the user within this date range
    if request.user.is_authenticated:
        events = Event.objects.filter(
            user=request.user,
            date__range=[start_date, end_date]
        ).order_by('date')
    else:
        events = []

    # Create a dict for quick event lookup
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

    # Create calendar days
    calendar_days = []

    # Previous month days
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

    # Current month days
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

    # Next month days to fill the remaining grid
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

    return render(request, 'home.html', context)


@login_required
def add_event(request):
    if request.method == 'POST':
        event_id = request.POST.get('event_id')
        title = request.POST.get('title')
        date_str = request.POST.get('date')
        color = request.POST.get('color')

        # Convert date string to date object
        event_date = datetime.strptime(date_str, '%Y-%m-%d').date()

        if event_id:  # Update existing event
            try:
                event = Event.objects.get(id=event_id, user=request.user)
                event.title = title
                event.date = event_date
                event.color = color
                event.save()
            except Event.DoesNotExist:
                pass
        else:  # Create new event
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
    # Your notes view logic here
    return render(request, 'notes.html')