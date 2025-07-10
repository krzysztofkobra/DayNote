import React, { useState, useEffect } from 'react';
import { Calendar, StickyNote, Settings, User, Mail, Clock, Globe, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AccountPage() {
  const [user, setUser] = useState({
    username: "",
    email: "",
    avatar: "",
    dateJoined: "",
    googleConnected: false
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('api/accounts/profile/', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser({
          username: userData.username,
          email: userData.email,
          avatar: userData.profile.avatar || 'https://via.placeholder.com/120',
          dateJoined: userData.date_joined,
          googleConnected: userData.profile.google_connected
        });
        setPreviewUrl(userData.profile.avatar || 'https://via.placeholder.com/120');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append('avatar', selectedImage);

    try {
      const response = await fetch('http://localhost:8000/api/accounts/profile/update/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
        body: formData,
      });

      if (response.ok) {
        fetchUserData();
        setSelectedImage(null);
        alert('Changes saved successfully!');
      } else {
        alert('Error saving changes');
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Error saving changes');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('Type "DELETE" to confirm account deletion:');
    
    if (confirmation !== 'DELETE') {
      if (confirmation !== null) {
        alert('Please type DELETE to confirm account deletion.');
      }
      return;
    }

    let password = '';
    if (!user.googleConnected) {
      password = window.prompt('Please enter your password to confirm:');
      if (!password) return;
    }

    try {
      const response = await fetch('api/accounts/delete/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE',
          password: password
        }),
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Error deleting account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account');
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
            alt="User"
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
              <span>Calendar</span>
            </a>
            <a href="/notes" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <StickyNote size={20} />
              <span>Notes</span>
            </a>
          </div>
        </nav>
        <div className="p-4 border-t">
          <a href="#" className="flex items-center space-x-3 p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <img
                  src={previewUrl}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                  onError={e => { e.target.src = 'https://via.placeholder.com/120'; }}
                />
                <label
                  htmlFor="avatar-input"
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                >
                  <User size={24} />
                </label>
                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500 mt-4">Click on the avatar to change your profile picture</p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleSaveChanges}
                disabled={!selectedImage}
                className={`px-8 py-3 rounded-full font-semibold transition-colors duration-200 shadow-sm hover:shadow-md ${
                  selectedImage 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Information</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Username</p>
                    <p className="text-sm text-gray-500">Your unique identifier</p>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{user.username}</p>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Mail size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-sm text-gray-500">Your contact email</p>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{user.email || "Not provided"}</p>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Clock size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Joined</p>
                    <p className="text-sm text-gray-500">Member since</p>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{user.dateJoined}</p>
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Globe size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Google</p>
                    <p className="text-sm text-gray-500">Account integration</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.googleConnected ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600 font-medium">Not connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => navigate('/logout')}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-4 rounded-2xl font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            
            <button 
              onClick={handleDeleteAccount}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <Trash2 size={20} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}