import React from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const navigate = useNavigate();

  const getCsrfToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') return value;
    }
    return '';
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await fetch('http://localhost:8000/api/logout/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
          'Content-Type': 'application/json',
        },
      });
      navigate('/login');
    } catch (error) {}
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-10 w-full max-w-md">
        <div className="flex flex-col items-center">
          <LogOut size={48} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2 text-gray-900">Log out</h2>
          <p className="text-gray-600 mb-8 text-center">
            Are you sure you want to log out?
          </p>
          <form className="w-full" onSubmit={handleLogout}>
            <button
              type="submit"
              className="w-full mb-3 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition-colors shadow-sm"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            <a
              href="/account"
              className="block w-full text-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl py-3 font-semibold transition-colors"
            >
              Cancel
            </a>
          </form>
        </div>
      </div>
    </div>
  );
}