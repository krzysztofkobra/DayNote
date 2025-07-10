import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/calendar.css'
import React, { useState, useEffect } from 'react';
import { Calendar, Settings, StickyNote, Grid, ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal, X, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'http://localhost:8000';

const CalendarApp = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [events, setEvents] = useState([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showMoreEventsModal, setShowMoreEventsModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    color: 'event-blue'
  });

  const [user, setUser] = useState({ username: '', avatar: '' });
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const navigate = useNavigate();

  const colors = [
    { value: 'event-blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'event-green', label: 'Green', class: 'bg-green-500' },
    { value: 'event-orange', label: 'Orange', class: 'bg-orange-500' }
  ];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const fetchCsrfToken = async () => {
    await fetch(`${BASE_URL}/api/csrf/`, { credentials: 'include' });
  };

  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
    return '';
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (!loadingUser) {
      fetchEvents();
    }
  }, [currentDate, loadingUser]);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const res = await fetch(`${BASE_URL}/api/user/`, { credentials: 'include' });
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUser({
          username: data.username,
          avatar: data.avatar || 'https://via.placeholder.com/60'
        });
        setLoadingUser(false);
      } else {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      navigate('/login', { replace: true });
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const res = await fetch(`${BASE_URL}/api/?year=${year}&month=${month}`, { credentials: 'include' });
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const formattedEvents = [];
        data.calendar_days.forEach(day => {
          day.events.forEach(event => {
            formattedEvents.push({
              id: event.id,
              title: event.title,
              date: event.date,
              startTime: event.startTime || '',
              endTime: event.endTime || '',
              color: event.color || 'event-blue'
            });
          });
        });
        setEvents(formattedEvents);
      }
    } catch (error) {
      setAlertMessage('Failed to load events');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async (eventData) => {
    try {
      const url = editingEvent ? `${BASE_URL}/api/event/${editingEvent.id}/` : `${BASE_URL}/api/event/`;
      const method = editingEvent ? 'PUT' : 'POST';
      const payload = {
        title: eventData.title,
        date: eventData.date,
        color: eventData.color,
        startTime: eventData.startTime,
        endTime: eventData.endTime
      };
      if (editingEvent) {
        payload.event_id = editingEvent.id;
      }
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        throw new Error('Failed to save event');
      }
    } catch (error) {
      throw error;
    }
  };

  const deleteEventFromServer = async (eventId) => {
    try {
      const res = await fetch(`${BASE_URL}/api/event/?event_id=${eventId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include'
      });
      if (res.status === 401) {
        navigate('/login', { replace: true });
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      throw error;
    }
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    const getEventsForDate = (dateStr) => {
      return events.filter(event => {
        const start = event.date;
        const end = event.endDate || event.date;
        return dateStr >= start && dateStr <= end;
      }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    };

    if (view === 'month') {
      const firstDay = new Date(year, month, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());

      const days = [];
      const currentDay = new Date(startDate);

      for (let i = 0; i < 35; i++) {
        const currentDateStr = currentDay.toISOString().split('T')[0];
        const dayEvents = getEventsForDate(currentDateStr);

        days.push({
          date: new Date(currentDay),
          number: currentDay.getDate(),
          isToday: currentDay.toDateString() === today.toDateString(),
          currentMonth: currentDay.getMonth() === month,
          events: dayEvents,
          fullDate: currentDateStr
        });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      return days;
    } 
    
    else if (view === 'week') {
      const currentDay = new Date(currentDate);
      currentDay.setDate(currentDay.getDate() - currentDay.getDay());

      const days = [];
      for (let i = 0; i < 7; i++) {
        const currentDateStr = currentDay.toISOString().split('T')[0];
        const dayEvents = getEventsForDate(currentDateStr);

        days.push({
          date: new Date(currentDay),
          number: currentDay.getDate(),
          isToday: currentDay.toDateString() === today.toDateString(),
          currentMonth: currentDay.getMonth() === month,
          events: dayEvents,
          fullDate: currentDateStr
        });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      return days;
    } 
    
    else if (view === 'day') {
      const currentDateStr = currentDate.toISOString().split('T')[0];
      const dayEvents = getEventsForDate(currentDateStr);

      return [{
        date: new Date(currentDate),
        number: currentDate.getDate(),
        isToday: currentDate.toDateString() === today.toDateString(),
        currentMonth: true,
        events: dayEvents,
        fullDate: currentDateStr
      }];
    }

    return [];
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openEventModal = (date) => {
    setSelectedDate(date);
    setEditingEvent(null);
    setEventForm({
      title: '',
      startTime: '',
      endTime: '',
      color: 'event-blue'
    });
    setShowEventModal(true);
  };

  const editEvent = (event) => {
    setEditingEvent(event);
    setSelectedDate(event.date);
    setEventForm({
      title: event.title,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      color: event.color
    });
    setShowEventModal(true);
  };

  const showMoreEvents = (date) => {
    const dayEvents = events.filter(event => event.date === date);
    setSelectedDateEvents(dayEvents);
    setShowMoreEventsModal(true);
  };

  const validateTimes = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    
    const start = new Date(`2000-01-01 ${startTime}`);
    const end = new Date(`2000-01-01 ${endTime}`);
    
    return start < end;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateTimes(eventForm.startTime, eventForm.endTime)) {
      setAlertMessage('The start time cannot be later than or equal to the end time!');
      setShowAlert(true);
      return;
    }

    try {
      setLoading(true);
      
      const eventData = {
        title: eventForm.title,
        date: selectedDate,
        startTime: eventForm.startTime,
        endTime: eventForm.endTime,
        color: eventForm.color
      };

      await saveEvent(eventData);
      await fetchEvents();
      setShowEventModal(false);
      
    } catch (error) {
      setAlertMessage('Failed to save event. Please try again.');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        setLoading(true);
        await deleteEventFromServer(eventId);
        await fetchEvents();
        setShowEventModal(false);
        setShowMoreEventsModal(false);
      } catch (error) {
        setAlertMessage('Failed to delete event. Please try again.');
        setShowAlert(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const getEventColor = (colorValue) => {
    switch (colorValue) {
      case 'event-blue': return 'bg-blue-500 text-white';
      case 'event-green': return 'bg-green-500 text-white';
      case 'event-orange': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const calendarDays = generateCalendarDays();

  const renderMonthView = () => {
    const calendarDays = generateCalendarDays();

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-7 text-center text-gray-500 font-semibold tracking-wide border-b border-gray-200 pb-2">
          {weekdays.map(day => (
            <div key={day} className="uppercase text-xs">{day}</div>
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
              <div className={`
                w-8 h-8 flex items-center justify-center rounded-full
                ${day.isToday ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                transition
                self-start
                mb-2
              `}>
                {day.number}
              </div>

              <div className="flex flex-col space-y-1 overflow-hidden flex-grow">
                {day.events.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-2 py-0.5 truncate whitespace-nowrap ${getEventColor(event.color)}`}
                    onClick={e => { e.stopPropagation(); editEvent(event); }}
                    title={`${event.title} (${event.startTime} - ${event.endTime || ''})`}
                  >
                    {event.title}
                  </div>
                ))}

                {day.events.length > 3 && (
                  <button
                    onClick={e => { e.stopPropagation(); showMoreEvents(day.fullDate); }}
                    className="text-xs text-blue-600 hover:underline mt-auto self-start"
                  >
                    +{day.events.length - 3} more
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const calendarDays = generateCalendarDays();

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-7 text-center text-gray-500 font-semibold tracking-wide border-b border-gray-200 pb-2">
          {weekdays.map(day => (
            <div key={day} className="uppercase text-xs">{day}</div>
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
              <div className={`
                text-sm font-semibold mb-2
                ${day.isToday ? 'text-blue-600' : ''}
              `}>
                {day.number} {monthNames[day.date.getMonth()]}
              </div>

              <div className="flex flex-col space-y-1 overflow-hidden flex-grow max-h-48">
                {day.events.length === 0 && (
                  <div className="text-xs text-gray-400 italic select-none">No events</div>
                )}

                {day.events.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs rounded px-2 py-1 truncate whitespace-nowrap cursor-pointer ${getEventColor(event.color)}`}
                    onClick={e => { e.stopPropagation(); editEvent(event); }}
                    title={`${event.title} (${event.startTime} - ${event.endTime || ''})`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const calendarDays = generateCalendarDays();
    const day = calendarDays[0];

    return (
      <div className="flex flex-col w-full h-full bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 border-b border-gray-200 pb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {day.date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
        </div>

        <div className="flex flex-col space-y-4 overflow-auto flex-grow">
          {day.events.length === 0 ? (
            <div className="text-gray-400 italic select-none">No events scheduled for this day.</div>
          ) : (
            day.events.map(event => (
              <div
                key={event.id}
                className={`border-l-4 pl-4 py-3 rounded bg-blue-50 cursor-pointer ${getEventColor(event.color)} border-blue-400 hover:bg-blue-100 transition`}
                onClick={() => editEvent(event)}
                title={`${event.title} (${event.startTime} - ${event.endTime || ''})`}
              >
                <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {event.startTime} - {event.endTime || '—'}
                </div>
                {event.description && (
                  <div className="text-xs text-gray-700 mt-2 line-clamp-3">
                    {event.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="animate-spin text-blue-500" size={40} />
      </div>
    );
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
              onError={e => { e.target.src = 'https://via.placeholder.com/80'; }}
            />
            <a href="account" className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 no-underline">
              {user.username}
            </a>
          </div>
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <a href="/" className="flex items-center space-x-3 p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Calendar size={20} />
                <span>Calendar</span>
              </a>
              <a href="/notes" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
                <StickyNote size={20} />
                <span>Notes</span>
              </a>
            </div>
          </nav>
          <div className="p-4 border-t">
            <a href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Settings size={20} />
              <span>Settings</span>
            </a>
          </div>
        </div>

        <div className='mainContent flex-1 flex flex-col w-full'>
          <div className='header flex items-center justify-between p-4 bg-white'>
            <h1 className="text-2xl font-bold text-gray-700">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Grid size={24} className="text-gray-500" />
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 hover:bg-gray-100"
                >
                  <option value="month">Month</option>
                  <option value="week">Week</option>
                  <option value="day">Day</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-blue-600 rounded-lg"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-blue-600 rounded-lg"
                >
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
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <RefreshCw className="animate-spin" size={32} />
              </div>
            )}
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </div>
        </div>
      </div>
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </h2>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={eventForm.startTime}
                  onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={eventForm.endTime}
                  onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Color
                </label>
                <select
                  value={eventForm.color}
                  onChange={(e) => setEventForm({ ...eventForm, color: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {colors.map((color) => (
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
                    <span>Delete</span>
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
                    <span>Save</span>
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
              <h2 className="text-lg font-semibold">All Events</h2>
              <button
                onClick={() => setShowMoreEventsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedDateEvents.map((event) => (
                <div
                  key={event.id}
                  className={`p-3 rounded cursor-pointer ${getEventColor(event.color)}`}
                  onClick={() => {
                    setShowMoreEventsModal(false);
                    editEvent(event);
                  }}
                >
                  <div className="font-medium">{event.title}</div>
                  {event.startTime && event.endTime && (
                    <div className="text-sm opacity-90">
                      {event.startTime} - {event.endTime}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 max-w-sm mx-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error</h3>
              <p className="text-gray-700 mb-4">{alertMessage}</p>
              <button
                onClick={() => setShowAlert(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarApp;