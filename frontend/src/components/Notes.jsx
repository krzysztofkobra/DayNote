import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect } from 'react';
import { Calendar, Settings, StickyNote, Filter, Plus, Edit, Trash2, X, Tag } from 'lucide-react';

const NotesApp = () => {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('last-edit');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [user, setUser] = useState({ username: '', avatar: '' });
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: '',
    newCategoryName: '',
    newCategoryColor: '#ff0000'
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#ff0000'
  });

  useEffect(() => {
    fetchUser();
    fetchNotesAndCategories();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, selectedCategories, sortBy]);

  const fetchUser = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/user/', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser({
          username: data.username,
          avatar: data.avatar || 'https://via.placeholder.com/60'
        });
      } else {
        setUser({
          username: 'Guest',
          avatar: 'https://via.placeholder.com/60'
        });
      }
    } catch (error) {
      setUser({
        username: 'Guest',
        avatar: 'https://via.placeholder.com/60'
      });
    }
  };

  const fetchNotesAndCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notes/', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    }
  };

  const filterAndSortNotes = () => {
    let filtered = [...notes];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(note => 
        selectedCategories.includes(note.category?.id) || 
        (selectedCategories.includes('uncategorized') && !note.category)
      );
    }

    switch (sortBy) {
      case 'last-edit':
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        break;
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'za':
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        break;
    }

    setFilteredNotes(filtered);
  };

  const handleCategoryFilter = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const openNoteModal = (note = null) => {
    setEditingNote(note);
    setNoteForm({
      title: note ? note.title : '',
      content: note ? note.content : '',
      category: note ? (note.category?.id || '') : '',
      newCategoryName: '',
      newCategoryColor: '#ff0000'
    });
    setShowNoteModal(true);
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingNote ? `http://localhost:8000/api/notes/note/${editingNote.id}/` : 'http://localhost:8000/api/notes/note/';
      const method = editingNote ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({
          title: noteForm.title,
          content: noteForm.content,
          category: noteForm.category,
          new_category_name: noteForm.newCategoryName,
          new_category_color: noteForm.newCategoryColor
        })
      });

      if (res.ok) {
        await fetchNotesAndCategories();
        setShowNoteModal(false);
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const deleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        const res = await fetch(`http://localhost:8000/api/notes/note/${noteId}/`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'X-CSRFToken': getCsrfToken()
          }
        });

        if (res.ok) {
          await fetchNotesAndCategories();
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('http://localhost:8000/api/notes/category/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        credentials: 'include',
        body: JSON.stringify({
          name: categoryForm.name,
          color: categoryForm.color
        })
      });

      if (res.ok) {
        await fetchNotesAndCategories();
        setShowCategoryModal(false);
        setCategoryForm({ name: '', color: '#ff0000' });
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  const removeCategoryFromNote = async (noteId) => {
    try {
      const res = await fetch(`http://localhost:8000/api/notes/note/${noteId}/remove_category/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });

      if (res.ok) {
        await fetchNotesAndCategories();
      }
    } catch (error) {
      console.error('Failed to remove category:', error);
    }
  };

  const autocategorizeAll = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notes/autocategorize/', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });

      if (res.ok) {
        await fetchNotesAndCategories();
      }
    } catch (error) {
      console.error('Failed to autocategorize notes:', error);
    }
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex w-64 bg-white flex-col">
        <div className="p-4 border-b flex flex-col items-center space-y-2">
          <img
            src={user.avatar}
            alt="User"
            className="w-20 h-20 rounded-full object-cover"
            onError={e => { e.target.src = 'https://via.placeholder.com/80'; }}
          />
          <a href="/account" className="font-semibold text-gray-800 hover:text-blue-600 transition-colors duration-300 no-underline">
            {user.username}
          </a>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <a href="/" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Calendar size={20} />
              <span>Calendar</span>
            </a>
            <a href="#" className="flex items-center space-x-3 p-3 bg-blue-100 text-blue-600 rounded-lg">
              <StickyNote size={20} />
              <span>Notes</span>
            </a>
          </div>
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-700 mb-3">Filter Options</div>
            <div className="flex items-center space-x-2 mb-3">
              <Filter size={16} className="text-gray-500" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="last-edit">Last Edit</option>
                <option value="az">A-Z</option>
                <option value="za">Z-A</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Categories</div>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes('uncategorized')}
                  onChange={() => handleCategoryFilter('uncategorized')}
                />
                <span>Uncategorized</span>
              </label>
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryFilter(category.id)}
                  />
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        </nav>
        <div className="p-4 border-t">
          <a href="/settings" className="flex items-center space-x-3 p-3 text-gray-600 hover:bg-gray-100 rounded-lg">
            <Settings size={20} />
            <span>Settings</span>
          </a>
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-6 bg-white border-b">
          <h1 className="text-2xl font-bold text-gray-700">My Notes</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={autocategorizeAll}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Autocategorize All
            </button>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <Tag size={16} />
              <span>Create Category</span>
            </button>
            <button
              onClick={() => openNoteModal()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Note</span>
            </button>
          </div>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          {filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <StickyNote size={64} className="mb-4" />
              <p className="text-lg mb-4">
                {notes.length === 0 ? "You don't have any notes yet." : "No notes match your filters."}
              </p>
              <button
                onClick={() => openNoteModal()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create your first note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.map(note => (
                <div key={note.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                      {note.title}
                    </h3>
                    {note.category && (
                      <div 
                        className="flex items-center space-x-1 px-2 py-1 rounded text-white text-xs ml-2"
                        style={{ backgroundColor: note.category.color }}
                      >
                        <span>{note.category.name}</span>
                        <button
                          onClick={() => removeCategoryFromNote(note.id)}
                          className="hover:bg-black hover:bg-opacity-20 rounded p-0.5"
                          title="Remove category"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {note.content}
                  </p>
                  <div className="text-xs text-gray-400 mb-3">
                    Last updated: {formatDate(note.updated_at)}
                  </div>
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openNoteModal(note)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="Edit note"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {editingNote ? 'Edit Note' : 'Add Note'}
              </h2>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={noteForm.category}
                    onChange={e => setNoteForm({ ...noteForm, category: e.target.value })}
                    className="border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">None</option>
                    <option value="new">+ New Category</option>
                    <option value="autocategorize">Autocategorize</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {noteForm.category === 'new' && (
                    <>
                      <input
                        type="text"
                        placeholder="Category name"
                        value={noteForm.newCategoryName}
                        onChange={e => setNoteForm({ ...noteForm, newCategoryName: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1"
                      />
                      <input
                        type="color"
                        value={noteForm.newCategoryColor}
                        onChange={e => setNoteForm({ ...noteForm, newCategoryColor: e.target.value })}
                        className="w-8 h-8 p-0 border-0"
                      />
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={noteForm.content}
                  onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingNote ? 'Update Note' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create Category</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-12 h-8 p-0 border-0"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesApp;
