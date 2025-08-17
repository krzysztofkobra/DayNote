import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/calendar.css'
import React, { useState, useEffect, useRef } from 'react'
import { Calendar, Settings, StickyNote, Grid, ChevronLeft, ChevronRight, RefreshCw, X, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Swal from 'sweetalert2'

const BASE_URL = 'http://localhost:8000'

const CalendarApp = () => {
  const { t } = useTranslation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState(() => localStorage.getItem('calendarView') || 'month');
  const [timezone, setTimezone] = useState(() => localStorage.getItem("timezone") || "Europe/Warsaw");
  const [events, setEvents] = useState([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [showMoreEventsModal, setShowMoreEventsModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedDateEvents, setSelectedDateEvents] = useState([])
  const [editingEvent, setEditingEvent] = useState(null)
  const [eventForm, setEventForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    color: 'event-blue'
  })
  const [user, setUser] = useState({ username: '', avatar: '' })
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)
  const scrollRef = useRef(null)
  const [currentHourLineTop, setCurrentHourLineTop] = useState(null)
  const navigate = useNavigate()

  const colors = [
    { value: 'event-blue', label: t('Blue') },
    { value: 'event-green', label: t('Green') },
    { value: 'event-orange', label: t('Orange') }
  ]

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const HOURS_IN_DAY = 24
  const HOUR_HEIGHT = 60

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0
    const [h, m] = timeStr.split(':').map(Number)
    return h * 60 + m
  }

  const showSwal = (icon, title) => {
      Swal.fire({ icon, title, timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' })
    }

  const fetchCsrfToken = async () => {
    await fetch(`${BASE_URL}/api/csrf/`, { credentials: 'include' })
  }

  const getCsrfToken = () => {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrftoken') {
        return value
      }
    }
    return ''
  }

  useEffect(() => {
    fetchCsrfToken()
    fetchUser()
  }, [])

  useEffect(() => {
    localStorage.setItem('calendarView', view);
  }, [view]);

  useEffect(() => {
    if (!loadingUser) {
      fetchEvents()
    }
  }, [currentDate, loadingUser])

   useEffect(() => {
  if (view === 'day' && scrollRef.current) {
    const getCurrentTimeInTimezone = () => {
      const now = new Date()
      if (timezone && timezone !== 'local') {
        return new Date(now.toLocaleString("en-US", {timeZone: timezone}))
      }
      return now
    }
    
    const currentTime = getCurrentTimeInTimezone()
    const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
    const topPosition = (nowMinutes / 60) * HOUR_HEIGHT
    setCurrentHourLineTop(topPosition)
    
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = topPosition - 120 > 0 ? topPosition - 120 : 0
      }
    }, 100)
  }
}, [view, currentDate])

  const fetchUser = async () => {
    setLoadingUser(true)
    try {
      const res = await fetch(`${BASE_URL}/api/user/`, { credentials: 'include' })
      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (res.ok) {
        const data = await res.json()
        setUser({
          username: data.username,
          avatar: data.avatar || 'https://via.placeholder.com/60'
        })
        setLoadingUser(false)
      } else {
        navigate('/login', { replace: true })
      }
    } catch {
      navigate('/login', { replace: true })
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1
      const res = await fetch(`${BASE_URL}/api/?year=${year}&month=${month}`, { credentials: 'include' })
      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (res.ok) {
        const data = await res.json()
        const formattedEvents = []
        data.calendar_days.forEach(day => {
        day.events.forEach(event => {
          formattedEvents.push({
            id: event.id,
            title: event.title,
            date: event.date,
            start_time: event.start_time ? event.start_time.slice(0, 5) : '',
            end_time: event.end_time ? event.end_time.slice(0, 5) : '',
            color: event.color || 'event-blue'
          })
        })
      })
        setEvents(formattedEvents)
        // showSwal('success', 'Events loaded')
      } else {
        showSwal('error', t('Failed to load events'))
      }
    } catch {
      showSwal('error', t('Failed to load events'))
    } finally {
      setLoading(false)
    }
  }

  const saveEvent = async (eventData) => {
  try {
    const url = editingEvent ? `${BASE_URL}/api/event/${editingEvent.id}/` : `${BASE_URL}/api/event/`
    const method = editingEvent ? 'PUT' : 'POST'

    let formattedDate = eventData.date
    if (eventData.date instanceof Date) {
      formattedDate = eventData.date.toISOString().slice(0, 10)
    } else if (typeof eventData.date === 'string' && eventData.date.length > 10) {
      formattedDate = eventData.date.slice(0, 10)
    }
    const payload = {
      title: eventData.title,
      date: formattedDate,
      color: eventData.color,
      start_time: eventData.start_time ? eventData.start_time.slice(0, 5) : '',
      end_time: eventData.end_time ? eventData.end_time.slice(0, 5) : ''
    }
    if (editingEvent) {
      payload.event_id = editingEvent.id
    }
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify(payload)
    })
    if (res.status === 401) {
      navigate('/login', { replace: true })
      return
    }
    if (res.ok) {
      Swal.fire({
        icon: 'success',
        title: t(editingEvent ? 'Event updated' : 'Event added')
      })
      return await res.json()
    } else {
      Swal.fire({
        icon: 'error',
        title: t('Failed to save event')
      })
      throw new Error('Failed to save event')
    }
  } catch (error) {
    throw error
  }
}

  const deleteEventFromServer = async (eventId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/event/?event_id=${eventId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include'
      })
      if (res.status === 401) {
        navigate('/login', { replace: true })
        return
      }
      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: t('Event deleted')
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: t('Failed to delete event')
        })
        throw new Error('Failed to delete event')
      }
    } catch (error) {
      throw error
    }
  }

const generateCalendarDays = () => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()

  const getEventsForDate = (dateStr) => {
    return events
      .filter(event => {
        const start = event.date
        const end = event.endDate || event.date
        return dateStr >= start && dateStr <= end
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const formatDateString = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  if (view === 'month') {
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    for (let i = 0; i < 35; i++) {
      const currentDateStr = formatDateString(currentDay)
      const dayEvents = getEventsForDate(currentDateStr)

      days.push({
        date: new Date(currentDay),
        number: currentDay.getDate(),
        isToday: currentDay.toDateString() === today.toDateString(),
        currentMonth: currentDay.getMonth() === month,
        events: dayEvents,
        fullDate: currentDateStr
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }
    return days
  } else if (view === 'week') {
    const currentDay = new Date(currentDate)
    currentDay.setDate(currentDay.getDate() - currentDay.getDay())

    const days = []
    for (let i = 0; i < 7; i++) {
      const currentDateStr = formatDateString(currentDay)
      const dayEvents = getEventsForDate(currentDateStr)

      days.push({
        date: new Date(currentDay),
        number: currentDay.getDate(),
        isToday: currentDay.toDateString() === today.toDateString(),
        currentMonth: currentDay.getMonth() === month,
        events: dayEvents,
        fullDate: currentDateStr
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }
    return days
  } else if (view === 'day') {
    const currentDateStr = formatDateString(currentDate)
    const dayEvents = getEventsForDate(currentDateStr)

    return [
      {
        date: new Date(currentDate),
        number: currentDate.getDate(),
        isToday: currentDate.toDateString() === today.toDateString(),
        currentMonth: true,
        events: dayEvents,
        fullDate: currentDateStr
      }
    ]
  }
  return []
}

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const openEventModal = (date, start_time = '') => {
    setSelectedDate(date)
    setEditingEvent(null)
    setEventForm({
      title: '',
      start_time,
      end_time: '',
      color: 'event-blue'
    })
    setShowEventModal(true)
  }

  const editEvent = event => {
    setEditingEvent(event)
    setSelectedDate(event.date)
    setEventForm({
      title: event.title,
      start_time: event.start_time || '',
      end_time: event.end_time || '',
      color: event.color
    })
    setShowEventModal(true)
  }

  const showMoreEvents = date => {
    const dayEvents = events.filter(event => event.date === date)
    setSelectedDateEvents(dayEvents)
    setShowMoreEventsModal(true)
  }

  const validateTimes = (start_time, end_time) => {
    if (!start_time || !end_time) return true
    const start = new Date(`2000-01-01T${start_time}:00`)
    const end = new Date(`2000-01-01T${end_time}:00`)
    return start < end
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validateTimes(eventForm.start_time, eventForm.end_time)) {
      Swal.fire({
        icon: 'error',
        title: t('Invalid Time'),
        text: t('The start time cannot be later than or equal to the end time!')
      })
      return
    }
    try {
      setLoading(true)
      const eventData = {
        title: eventForm.title,
        date: selectedDate,
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        color: eventForm.color
      }
      await saveEvent(eventData)
      await fetchEvents()
      setShowEventModal(false)
    } catch {
      Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Failed to save event. Please try again.')
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteEvent = async eventId => {
  const result = await Swal.fire({
    title: t('Are you sure?'),
    text: t('Do you really want to delete this event?'),
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: t('Yes, delete it'),
    cancelButtonText: t('Cancel')
  })

  if (result.isConfirmed) {
    try {
      setLoading(true)
      await deleteEventFromServer(eventId)
      await fetchEvents()
      setShowEventModal(false)
      setShowMoreEventsModal(false)
    } catch {
      Swal.fire({
        icon: 'error',
        title: t('Error'),
        text: t('Failed to delete event. Please try again.')
      })
    } finally {
      setLoading(false)
    }
  }
}

  const getEventColor = colorValue => {
    switch (colorValue) {
      case 'event-blue':
        return 'bg-blue-500 text-white'
      case 'event-green':
        return 'bg-green-500 text-white'
      case 'event-orange':
        return 'bg-orange-500 text-white'
      default:
        return 'bg-blue-500 text-white'
    }
  }

  const calendarDays = generateCalendarDays()

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays()

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-7 text-center text-gray-500 font-semibold tracking-wide border-b border-gray-200 pb-2">
          {weekdays.map(day => (
            <div key={day} className="uppercase text-xs">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-4 mt-3 flex-grow">
          {calendarDays.map(day => (
            <div
              key={day.fullDate}
              className={`
                relative cursor-pointer flex flex-col
                rounded-lg
                ${day.currentMonth ? 'text-gray-900' : 'text-gray-400'}
                ${day.isToday ? 'font-semibold' : 'font-normal'}
                hover:bg-blue-50
                transition
                `}
              onClick={() => openEventModal(day.fullDate)}
            >
              <div
                className={`
                w-8 h-8 flex items-center justify-center rounded-xl
                ${day.isToday ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                transition
                self-start
                mb-2
              `}
              >
                {day.number}
              </div>

              <div className="flex flex-col space-y-1 overflow-hidden flex-grow">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-2 py-0.5 truncate whitespace-nowrap ${getEventColor(
                      event.color
                    )}`}
                    onClick={e => {
                      e.stopPropagation()
                      editEvent(event)
                    }}
                    title={`${event.title} (${event.start_time} - ${event.end_time || ''})`}
                  >
                    {event.title}
                  </div>
                ))}

                {day.events.length > 3 && (
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      showMoreEvents(day.fullDate)
                    }}
                    className="text-xs text-white mt-auto self-start w-full py-1"
                  >
                    +{day.events.length - 3} more
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const calendarDays = generateCalendarDays()

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-7 text-center text-gray-500 font-semibold tracking-wide border-b border-gray-200 pb-2">
          {weekdays.map(day => (
            <div key={day} className="uppercase text-xs">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-x-4 gap-y-6 mt-3 flex-grow">
          {calendarDays.map(day => (
            <div
              key={day.fullDate}
              className={`
                relative cursor-pointer flex flex-col rounded-lg p-3
                ${day.isToday ? 'bg-blue-50 border border-blue-300' : 'hover:bg-gray-50'}
                ${day.currentMonth ? 'text-gray-900' : 'text-gray-400'}
                transition
              `}
              onClick={() => openEventModal(day.fullDate)}
            >
              <div
                className={`
                text-sm font-semibold mb-2
                ${day.isToday ? 'text-blue-600' : ''}
              `}
              >
                {day.number} {monthNames[day.date.getMonth()]}
              </div>

              <div className="flex flex-col space-y-1 overflow-hidden flex-grow max-h-48">
                {day.events.length === 0 && (
                  <div className="text-xs text-gray-400 italic select-none">{t('No events')}</div>
                )}

                {day.events.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-2 py-1 truncate whitespace-nowrap cursor-pointer ${getEventColor(
                      event.color
                    )}`}
                    onClick={e => {
                      e.stopPropagation()
                      editEvent(event)
                    }}
                    title={`${event.title} (${event.start_time} - ${event.end_time || ''})`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

const renderDayView = () => {
  const day = calendarDays[0];
  const containerHeight = HOURS_IN_DAY * HOUR_HEIGHT;
  const currentTime = (() => {
    const now = new Date();
    if (timezone && timezone !== 'local') {
      return new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    }
    return now;
  })();
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentLineTop = (nowMinutes / 60) * HOUR_HEIGHT;

  const getEventPositions = (events) => {
    const validEvents = events.filter(event => {
      return event.start_time && event.start_time !== '';
    });
    
    const sortedEvents = [...validEvents].sort((a, b) => {
      const startA = timeToMinutes(a.start_time);
      const startB = timeToMinutes(b.start_time);
      return startA - startB;
    });

    const positions = [];
    
    for (const event of sortedEvents) {
      const startM = timeToMinutes(event.start_time);
      let endM = event.end_time && event.end_time !== '' ? timeToMinutes(event.end_time) : startM + 30;
      if (endM <= startM) endM = startM + 30;

      let column = 0;
      let maxColumns = 1;
      
      while (positions.some(pos => 
        pos.column === column && 
        pos.startM < endM && 
        pos.endM > startM
      )) {
        column++;
        maxColumns = Math.max(maxColumns, column + 1);
      }

      positions.push({
        ...event,
        startM,
        endM,
        column,
        maxColumns
      });
    }

    positions.forEach(pos => {
      const overlappingEvents = positions.filter(other => 
        other.startM < pos.endM && other.endM > pos.startM
      );
      const totalColumns = Math.max(...overlappingEvents.map(e => e.column)) + 1;
      pos.maxColumns = totalColumns;
    });

    return positions;
  };

  const eventPositions = getEventPositions(day.events);

  return (
    <div className="w-full h-full bg-white rounded-lg shadow-md flex flex-col">
      <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
        <h2 className="text-xl font-semibold text-gray-900">
          {day.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full flex flex-row border-t border-gray-200 select-none overflow-y-auto relative"
          style={{ maxHeight: 'calc(100vh - 173px)' }}
        >
          <div
            className="flex flex-col bg-gray-50 border-r border-gray-200 flex-shrink-0"
            style={{ width: 60, userSelect: 'none', height: containerHeight }}
          >
            {[...Array(HOURS_IN_DAY).keys()].map(hour => (
              <div
                key={hour}
                className="flex items-center justify-center text-xs text-gray-500 font-mono border-b border-gray-200"
                style={{ height: HOUR_HEIGHT }}
              >
                {hour}:00
              </div>
            ))}
          </div>
          <div className="relative flex-1 min-w-0" style={{ height: containerHeight, position: 'relative' }}>
            {[...Array(HOURS_IN_DAY).keys()].map(hour => (
              <div
                key={hour}
                className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer"
                style={{ height: HOUR_HEIGHT }}
                onClick={() => {
                  const hh = hour.toString().padStart(2, '0');
                  openEventModal(day.fullDate, `${hh}:00`);
                }}
              />
            ))}
            {eventPositions.map(event => {
              const top = (event.startM / 60) * HOUR_HEIGHT;
              const height = ((event.endM - event.startM) / 60) * HOUR_HEIGHT;
              const width = `${100 / event.maxColumns}%`;
              const left = `${(event.column * 100) / event.maxColumns}%`;
              
              return (
                <div
                  key={event.id}
                  onClick={e => {
                    e.stopPropagation();
                    editEvent(event);
                  }}
                  title={`${event.title} (${event.start_time || '...'} - ${event.end_time || '...'})`}
                  className={`absolute rounded-md shadow-md px-2 py-1 cursor-pointer overflow-hidden text-ellipsis ${getEventColor(event.color)}`}
                  style={{ 
                    top, 
                    height, 
                    width, 
                    left, 
                    zIndex: 10,
                    marginRight: '1px'
                  }}
                >
                  <div className="font-medium text-sm leading-tight">{event.title}</div>
                  <div className="text-[11px] opacity-70 leading-tight">
                    {event.start_time} - {event.end_time || '—'}
                  </div>
                </div>
              );
            })}
            <div
              className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
              style={{ top: currentLineTop }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex h-screen bg-gray-50">
        <div className="hidden md:flex w-64 bg-white flex-col">
          <div className="p-4 border-b flex flex-col items-center space-y-2">
            <img
              src={user.avatar}
              alt="User"
              className="w-20 h-20 rounded-full object-cover"
              onError={e => {
                e.target.src = 'https://via.placeholder.com/80'
              }}
            />
            <a
              href="account"
              className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 no-underline"
            >
              {user.username}
            </a>
          </div>
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <a href="/" className="flex items-center space-x-3 p-3 text-blue-600 bg-blue-50 font-semibold rounded-lg transition-colors">
                <Calendar size={20} />
                <span>{t('Calendar')}</span>
              </a>
              <a
                href="/notes"
                className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <StickyNote size={20} />
                <span>{t('Notes')}</span>
              </a>
            </div>
          </nav>
          <div className="p-4 border-t">
            <a href="/settings" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings size={20} />
              <span>{t('Settings')}</span>
            </a>
          </div>
        </div>

        <div className="mainContent flex-1 flex flex-col w-full">
          <div className="header flex items-center justify-between p-4 bg-white">
            <h1 className="text-2xl font-bold text-gray-700">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Grid size={24} className="text-gray-500" />
                <select
                  value={view}
                  onChange={e => setView(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 hover:bg-gray-100"
                >
                  <option value="month">{t('Month')}</option>
                  <option value="week">{t('Week')}</option>
                  <option value="day">{t('Day')}</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-blue-600 rounded-lg">
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  {t('Today')}
                </button>
                <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-blue-600 rounded-lg">
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={fetchEvents}
                  className="p-2 hover:bg-blue-600 rounded-lg"
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
          </div>
          <div className="Calendar flex-1 flex w-full">
            {loading ? (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <RefreshCw className="animate-spin" size={32} />
              </div>
            ) : view === 'month' ? (
              renderMonthView()
            ) : view === 'week' ? (
              renderWeekView()
            ) : (
              renderDayView()
            )}
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{editingEvent ? 'Edit Event' : 'Add Event'}</h2>
              <button
                onClick={() => setShowEventModal(false)}
                title="Close"
                className="p-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                style={{ border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Start Time')}</label>
                <input
                  type="time"
                  value={eventForm.start_time}
                  onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('End Time')}</label>
                <input
                  type="time"
                  value={eventForm.end_time}
                  onChange={e => setEventForm({ ...eventForm, end_time: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Color</label>
                <select
                  value={eventForm.color}
                  onChange={e => setEventForm({ ...eventForm, color: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {colors.map(color => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between pt-4">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => deleteEvent(editingEvent.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center space-x-2"
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    <span>{t('Delete')}</span>
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowEventModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
                    disabled={loading}
                  >
                    {loading && <RefreshCw size={16} className="animate-spin" />}
                    <span>{t('Save')}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMoreEventsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">{t('All Events')}</h2>
              <button
                onClick={() => setShowMoreEventsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDateEvents.map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded cursor-pointer ${getEventColor(event.color)}`}
                  onClick={() => {
                    setShowMoreEventsModal(false)
                    editEvent(event)
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.start_time && event.end_time && (
                    <div className="text-sm opacity-90">
                      {event.start_time} - {event.end_time}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CalendarApp