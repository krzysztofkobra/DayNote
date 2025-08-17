import React, { useState, useEffect } from "react";
import { Calendar, StickyNote, Settings, Sun, Moon, Globe, CalendarDays, BookText, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const BASE_URL = 'http://localhost:8000';

const timezones = [
  "Europe/Warsaw", "Europe/London", "America/New_York", "Asia/Tokyo"
];

const languages = [
  { value: "en", label: "English" },
  { value: "pl", label: "Polski" }
];

export default function SettingsPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [timezone, setTimezone] = useState(() => localStorage.getItem("timezone") || "Europe/Warsaw");
  const [weekLayout, setWeekLayout] = useState(() => localStorage.getItem("weekLayout") || "sun");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "en");
  const [calendarView, setCalendarView] = useState(() => localStorage.getItem("calendarView") || "month");

 const { t, i18n } = useTranslation();

  const [user, setUser] = useState({
    username: "",
    email: "",
    avatar: "",
  });
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("timezone", timezone);
    localStorage.setItem("weekLayout", weekLayout);
    localStorage.setItem("language", language);
    localStorage.setItem("calendarView", calendarView);
  }, [theme, timezone, weekLayout, language, calendarView]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/accounts/profile/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login', { replace: true });
        return;
      }

      if (response.ok) {
        const userData = await response.json();
        setUser({
          username: userData.username,
          email: userData.email,
          avatar: userData.profile.avatar || 'https://via.placeholder.com/120',
        });
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex w-64 bg-white flex-col shadow-sm">
        <div className="p-4 border-b flex flex-col items-center space-y-2">
          <img
            src={user.avatar}
            alt=""
            className="w-20 h-20 rounded-full object-cover"
            onError={e => { e.target.src = 'https://via.placeholder.com/80'; }}
          />
          <a href="#" className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 no-underline">
            {user.username}
          </a>
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <a href="/" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Calendar size={20} />
              <span>{t("Calendar")}</span>
            </a>
            <a href="/notes" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <StickyNote size={20} />
              <span>{t("Notes")}</span>
            </a>
          </div>
        </nav>
        <div className="p-4 border-t">
          <a href="/settings" className="flex items-center space-x-3 p-3 text-blue-600 bg-blue-50 font-semibold rounded-lg transition-colors">
            <Settings size={20} />
            <span>{t("Settings")}</span>
          </a>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-start pt-16 overflow-auto min-h-screen">
        <div className="max-w-2xl w-full p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">{t("Settings")}</h1>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-8">

            <div>
              <label className="block mb-3 font-medium text-gray-800 flex items-center space-x-2">
                <Globe size={20} /> <span>{t("Timezone")}</span>
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-800 font-semibold"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace("_", " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-3 font-medium text-gray-800 flex items-center space-x-2">
                <BookText size={20} /> <span>{t("Language")}</span>
              </label>
              <select
                value={language}
                onChange={e => {
                    setLanguage(e.target.value);
                    i18n.changeLanguage(e.target.value);
                    localStorage.setItem("language", e.target.value);
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 focus:ring-2 focus:ring-blue-500 text-gray-800 font-semibold"
              >
                {languages.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            {/* <div>
              <label className="block mb-3 font-medium text-gray-800 flex items-center space-x-2">
                <CalendarDays size={20} /> <span>{t("Week System")}</span>
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setWeekLayout("sun")}
                  className={`hover:text-white px-6 py-2 rounded-xl font-semibold ${weekLayout === "sun" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t("SUN–SAT")}</button>
                <button
                  onClick={() => setWeekLayout("mon")}
                  className={`hover:text-white px-6 py-2 rounded-xl font-semibold ${weekLayout === "mon" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t("MON–SUN")}</button>
              </div>
            </div> */}

            <div>
              <label className="block mb-3 font-medium text-gray-800 flex items-center space-x-2">
                <Eye size={20} /> <span>{t("Calendar Default View")}</span>
              </label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setCalendarView("month")}
                  className={`hover:text-white px-6 py-2 rounded-xl font-semibold ${calendarView === "month" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t("Month")}</button>
                <button
                  onClick={() => setCalendarView("week")}
                  className={`hover:text-white px-6 py-2 rounded-xl font-semibold ${calendarView === "week" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t("Week")}</button>
                <button
                  onClick={() => setCalendarView("day")}
                  className={`hover:text-white px-6 py-2 rounded-xl font-semibold ${calendarView === "day" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                >{t("Day")}</button>
              </div>
            </div>

            {/* <div>
              <label className="block mb-3 font-medium text-gray-800 flex items-center space-x-2">
                <Sun size={20} /><span>{t("Theme")}</span>
              </label>
              <div className="flex items-center space-x-5">
                <button
                  onClick={() => setTheme("light")}
                  className={`hover:text-white flex items-center px-5 py-2 rounded-full font-semibold ${theme === "light" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
                ><Sun size={18} className="mr-2" /> {t("Light")}</button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`hover:text-white flex items-center px-5 py-2 rounded-full font-semibold ${theme === "dark" ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-700"}`}
                ><Moon size={18} className="mr-2" /> {t("Dark")}</button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}