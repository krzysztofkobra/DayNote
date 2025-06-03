import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/calendar.css'
import React, { useState, useEffect } from 'react';
import { Calendar, Settings, StickyNote, Grid, ChevronLeft, ChevronRight, RefreshCw, MoreHorizontal, X, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetch('/api/user/', {
      credentials: 'include'
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        setUser({
          username: data.username,
          avatar: data.avatar || 'https://via.placeholder.com/60'
        });
      })
      .catch(() => {
        setUser({
          username: 'Guest',
          avatar: 'https://via.placeholder.com/60'
        });
      });

    const sampleEvents = [
      {
        id: 1,
        title: 'Team Meeting',
        date: '2025-06-05',
        startTime: '09:00',
        endTime: '10:00',
        color: 'event-blue'
      },
      {
        id: 2,
        title: 'Lunch with Client',
        date: '2025-06-05',
        startTime: '12:00',
        endTime: '14:00',
        color: 'event-green'
      },
      {
        id: 3,
        title: 'Project Review',
        date: '2025-06-10',
        startTime: '15:00',
        endTime: '16:30',
        color: 'event-orange'
      },
      {
        id: 4,
        title: 'Workshop',
        date: '2025-06-05',
        startTime: '16:00',
        endTime: '17:00',
        color: 'event-blue'
      }
    ];
    setEvents(sampleEvents);
  }, []);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 35; i++) {
      const dayEvents = events
        .filter(event => event.date === currentDay.toISOString().split('T')[0])
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      
      days.push({
        date: new Date(currentDay),
        number: currentDay.getDate(),
        isToday: currentDay.toDateString() === today.toDateString(),
        currentMonth: currentDay.getMonth() === month,
        events: dayEvents,
        fullDate: currentDay.toISOString().split('T')[0]
      });
      
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateTimes(eventForm.startTime, eventForm.endTime)) {
      setAlertMessage('The start time cannot be later than or equal to the end time!');
      setShowAlert(true);
      return;
    }

    const newEvent = {
      id: editingEvent ? editingEvent.id : Date.now(),
      title: eventForm.title,
      date: selectedDate,
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      color: eventForm.color
    };

    if (editingEvent) {
      setEvents(events.map(event => 
        event.id === editingEvent.id ? newEvent : event
      ));
    } else {
      setEvents([...events, newEvent]);
    }

    setShowEventModal(false);
  };

  const deleteEvent = (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setEvents(events.filter(event => event.id !== eventId));
      setShowEventModal(false);
      setShowMoreEventsModal(false);
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
        <a href="/twoja-sciezka" className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 no-underline">
            {user.username}
        </a>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <a href="#" className="flex items-center space-x-3 p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Calendar size={20} />
            <span>Calendar</span>
          </a>
          <a href="#" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
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
                  className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-100"
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
                <button className="p-2 hover:bg-blue-600 rounded-lg">
                  <RefreshCw size={16} />
                </button>
              </div>
              </div>
        </div>

        <div className="Calendar flex-1 flex w-full">

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
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save
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
            <h3 className="text-lg font-semibold text-red-600 mb-2">Time Error</h3>
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
