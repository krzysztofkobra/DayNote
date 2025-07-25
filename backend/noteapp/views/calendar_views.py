from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.authentication import SessionAuthentication, BasicAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from datetime import datetime, date
import calendar

from ..models import Event
from ..serializers import EventSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_view(request):
    today = datetime.now()
    year = int(request.GET.get('year', today.year))
    month = int(request.GET.get('month', today.month))
    _, num_days = calendar.monthrange(year, month)
    first_day = (calendar.monthrange(year, month)[0] + 1) % 7

    if month == 1:
        prev_month_year, prev_month = year - 1, 12
    else:
        prev_month_year, prev_month = year, month - 1
    _, prev_month_days = calendar.monthrange(prev_month_year, prev_month)
    start_date = date(prev_month_year, prev_month, prev_month_days - first_day + 1) if first_day > 0 else date(year, month, 1)

    if month == 12:
        next_month_year, next_month = year + 1, 1
    else:
        next_month_year, next_month = year, month + 1
    remaining_days = 42 - (first_day + num_days)
    end_date = date(next_month_year, next_month, remaining_days) if remaining_days > 0 else date(year, month, num_days)

    events = Event.objects.filter(user=request.user, date__range=[start_date, end_date]).order_by('date')
    event_dict = {}
    for event in events:
        date_str = event.date.strftime('%Y-%m-%d')
        event_dict.setdefault(date_str, []).append({
            'id': event.id,
            'title': event.title,
            'date': date_str,
            'color': event.color,
            'start_time': event.start_time.strftime('%H:%M') if event.start_time else '',
            'end_time': event.end_time.strftime('%H:%M') if event.end_time else ''
        })

    calendar_days = []
    for i in range(first_day):
        day = prev_month_days - first_day + i + 1
        full_date = date(prev_month_year, prev_month, day)
        calendar_days.append({
            'number': day,
            'full_date': full_date.strftime('%Y-%m-%d'),
            'current_month': False,
            'is_today': False,
            'events': event_dict.get(full_date.strftime('%Y-%m-%d'), [])
        })

    for i in range(1, num_days + 1):
        full_date = date(year, month, i)
        calendar_days.append({
            'number': i,
            'full_date': full_date.strftime('%Y-%m-%d'),
            'current_month': True,
            'is_today': full_date == today.date(),
            'events': event_dict.get(full_date.strftime('%Y-%m-%d'), [])
        })

    for i in range(1, remaining_days + 1):
        full_date = date(next_month_year, next_month, i)
        calendar_days.append({
            'number': i,
            'full_date': full_date.strftime('%Y-%m-%d'),
            'current_month': False,
            'is_today': False,
            'events': event_dict.get(full_date.strftime('%Y-%m-%d'), [])
        })

    return Response({
        'calendar_days': calendar_days,
        'month_name': calendar.month_name[month],
        'year': year,
        'month': month,
    })

@api_view(['GET', 'POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def event_view(request, event_id=None):
    if request.method == 'GET':
        start = request.GET.get('start')
        end = request.GET.get('end')
        if not start or not end:
            return Response({'error': 'start and end parameters are required'}, status=400)

        events = Event.objects.filter(
            user=request.user,
            date__range=[start, end]
        ).order_by('date')

        result = []
        for e in events:
            print(f"Event: {e.title}, start_time: {e.start_time}, end_time: {e.end_time}")
            result.append({
                'id': e.id,
                'title': e.title,
                'date': e.date.strftime('%Y-%m-%d'),
                'color': e.color,
                'start_time': e.start_time.strftime('%H:%M') if e.start_time else '',
                'end_time': e.end_time.strftime('%H:%M') if e.end_time else ''
            })

        return Response(result)

    elif request.method in ['POST', 'PUT']:
        title = request.data.get('title')
        date_str = request.data.get('date')
        color = request.data.get('color')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')

        try:
            event_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except Exception as e:
            print(f"Date parsing error: {e}")
            return Response({'error': 'Invalid date format'}, status=400)

        try:
            start_time = datetime.strptime(start_time_str, '%H:%M').time() if start_time_str else time(0, 1)
            end_time = datetime.strptime(end_time_str, '%H:%M').time() if end_time_str else time(23, 59)
        except Exception as e:
            print(f"Time parsing error: {e}")
            return Response({'error': 'Invalid time format'}, status=400)

        if request.method == 'POST':
            event_id_post = request.data.get('event_id')
            if event_id_post:
                try:
                    event = Event.objects.get(id=event_id_post, user=request.user)
                    event.title = title
                    event.date = event_date
                    event.color = color
                    event.start_time = start_time
                    event.end_time = end_time
                    event.save()
                    serializer = EventSerializer(event)
                    return Response(serializer.data, status=200)
                except Event.DoesNotExist:
                    return Response({'error': 'Event not found'}, status=404)
            else:
                event = Event.objects.create(
                    title=title,
                    date=event_date,
                    color=color,
                    start_time=start_time,
                    end_time=end_time,
                    user=request.user
                )
                serializer = EventSerializer(event)
                return Response(serializer.data, status=201)

        elif request.method == 'PUT':
            if not event_id:
                return Response({'error': 'event_id is required in URL for PUT'}, status=400)
            event = get_object_or_404(Event, id=event_id, user=request.user)
            event.title = title
            event.date = event_date
            event.color = color
            event.start_time = start_time
            event.end_time = end_time
            event.save()
            serializer = EventSerializer(event)
            return Response(serializer.data, status=200)

    elif request.method == 'DELETE':
        event_id_delete = request.GET.get('event_id')
        if not event_id_delete:
            return Response({'error': 'event_id is required'}, status=400)

        event = get_object_or_404(Event, id=event_id_delete, user=request.user)
        event.delete()
        return Response({'status': 'ok'})