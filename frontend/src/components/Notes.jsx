import 'bootstrap/dist/css/bootstrap.min.css'
import React, { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import { HexColorPicker } from "react-colorful"
import { Calendar, Settings, StickyNote, Filter, Plus, Edit, Trash2, X, Tag } from 'lucide-react'

const NotesApp = () => {
  const [notes, setNotes] = useState([])
  const [categories, setCategories] = useState([])
  const [filteredNotes, setFilteredNotes] = useState([])
  const [selectedCategories, setSelectedCategories] = useState([])
  const [sortBy, setSortBy] = useState('last-edit')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [user, setUser] = useState({ username: '', avatar: '' })
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    category: '',
    newCategoryName: '',
    newCategoryColor: '#ff0000'
  })
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#ff0000'
  })

  useEffect(() => {
    fetchUser()
    fetchNotesAndCategories()
  }, [])

  useEffect(() => {
    filterAndSortNotes()
  }, [notes, selectedCategories, sortBy])

  const fetchUser = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/user/', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setUser({
          username: data.username,
          avatar: data.avatar || 'https://via.placeholder.com/60'
        })
      } else {
        setUser({
          username: 'Guest',
          avatar: 'https://via.placeholder.com/60'
        })
      }
    } catch {
      setUser({ username: 'Guest', avatar: 'https://via.placeholder.com/60' })
    }
  }

  const fetchNotesAndCategories = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notes/', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setNotes(data.notes || [])
        setCategories(data.categories?.sort((a, b) => a.name.localeCompare(b.name)) || [])
      }
    } catch {
      showSwal('error', 'Failed to fetch notes')
    }
  }

  const filterAndSortNotes = () => {
    let filtered = [...notes]
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(note => {
        if (!note.category && selectedCategories.includes('none')) return true
        if (note.category && selectedCategories.includes(note.category.name)) return true
        return false
      })
    }
    switch (sortBy) {
      case 'last-edit':
        filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        break
      case 'az':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'za':
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
      case 'by-category':
        filtered.sort((a, b) => {
          const catA = a.category?.name?.toLowerCase() || 'zzzzzz'
          const catB = b.category?.name?.toLowerCase() || 'zzzzzz'
          const comp = catA.localeCompare(catB)
          return comp !== 0 ? comp : a.title.localeCompare(b.title)
        })
        break
      default: break
    }
    setFilteredNotes(filtered)
  }

  const handleCategoryFilter = catNameOrNone => {
    setSelectedCategories(prev =>
      prev.includes(catNameOrNone)
        ? prev.filter(n => n !== catNameOrNone)
        : [...prev, catNameOrNone]
    )
  }

  const openNoteModal = (note = null) => {
    setEditingNote(note)
    setNoteForm({
      title: note ? note.title : '',
      content: note ? note.content : '',
      category: note ? (note.category?.id || '') : '',
      newCategoryName: '',
      newCategoryColor: '#ff0000'
    })
    setShowNoteModal(true)
  }

  const handleNoteSubmit = async e => {
    e.preventDefault()
    if (noteForm.category === 'new' && !noteForm.newCategoryName.trim()) {
      showSwal('error', 'Category name required!')
      return
    }
    if (noteForm.category === 'autocategorize') {
      await autocategorizeSingle()
      return
    }
    try {
      const url = editingNote
        ? `http://localhost:8000/api/notes/note/${editingNote.id}/`
        : 'http://localhost:8000/api/notes/note/'
      const method = editingNote ? 'PUT' : 'POST'
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
          category: noteForm.category === 'new' ? null : noteForm.category === '' ? null : noteForm.category,
          new_category_name: noteForm.category === 'new' ? noteForm.newCategoryName : null,
          new_category_color: noteForm.category === 'new' ? noteForm.newCategoryColor : null
        })
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        setShowNoteModal(false)
        showSwal('success', editingNote ? 'Note updated 🎉' : 'Note created 🎉')
      } else {
        showSwal('error', 'Failed to save note')
      }
    } catch {
      showSwal('error', 'Failed to save note')
    }
  }

  const autocategorizeSingle = async () => {
    if (!editingNote) return
    try {
      const res = await fetch(`http://localhost:8000/api/notes/note/${editingNote.id}/autocategorize/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCsrfToken() }
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        setShowNoteModal(false)
        showSwal('success', 'Autocategorized!')
      } else {
        showSwal('error', 'Could not autocategorize')
      }
    } catch {
      showSwal('error', 'Could not autocategorize')
    }
  }

  const deleteNote = async noteId => {
    const confirm = await Swal.fire({
      title: 'Delete note?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    })
    if (!confirm.isConfirmed) return
    try {
      const res = await fetch(`http://localhost:8000/api/notes/note/${noteId}/delete/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCsrfToken() }
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        showSwal('info', 'Note deleted')
      }
    } catch {
      showSwal('error', 'Failed to delete note')
    }
  }

  const handleCategorySubmit = async e => {
    e.preventDefault()
    if (!categoryForm.name.trim()) {
      showSwal('error', 'Category name required!')
      return
    }
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
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        setShowCategoryModal(false)
        setCategoryForm({ name: '', color: '#ff0000' })
        showSwal('success', 'Category created!')
      } else {
        showSwal('error', 'Failed to create category')
      }
    } catch {
      showSwal('error', 'Failed to create category')
    }
  }

  const removeCategoryFromNote = async noteId => {
    try {
      const res = await fetch(`http://localhost:8000/api/notes/note/${noteId}/remove_category/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCsrfToken() }
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        showSwal('success', 'Removed category from note')
      }
    } catch {
      showSwal('error', 'Failed to remove category')
    }
  }

  const autocategorizeAll = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/notes/autocategorize/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': getCsrfToken() }
      })
      if (res.ok) {
        await fetchNotesAndCategories()
        showSwal('success', 'All notes have been beautifully categorized! 🚀')
      }
    } catch {
      showSwal('error', 'Failed to autocategorize!')
    }
  }

  const getCsrfToken = () => {
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrftoken') return value
    }
    return ''
  }

  const showSwal = (icon, title) => {
    Swal.fire({ icon, title, timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' })
  }

  const formatDate = dateString => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric'
  })

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex w-64 bg-white flex-col">
        <div className="p-4 border-b flex flex-col items-center space-y-2">
          <img
            src={user.avatar}
            alt="User"
            className="w-20 h-20 rounded-full object-cover"
            onError={e => { e.target.src = 'https://via.placeholder.com/80' }}
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
            <a href="#" className="flex items-center space-x-3 p-3 text-blue-600 bg-blue-50 font-semibold rounded-lg transition-colors">
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
                onChange={e => setSortBy(e.target.value)}
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
                  checked={selectedCategories.includes('none')}
                  onChange={() => handleCategoryFilter('none')}
                />
                <span>Uncategorized</span>
              </label>
              {categories.map(category => (
                <label key={category.id} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.name)}
                    onChange={() => handleCategoryFilter(category.name)}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.color }}
                  />
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
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map(note => (
              <div key={note.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col border border-gray-200 p-0">
                <div className="p-4 flex-1 flex flex-col min-h-[220px]">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">{note.title}</h3>
                  <div
                    className="flex items-center mb-3 rounded-lg group"
                    style={{
                      backgroundColor: note.category ? note.category.color : '#bbbbbb',
                      width: '100%',
                      minHeight: '28px',
                      position: 'relative',
                      padding: '0 10px'
                    }}
                  >
                    <span className="text-xs font-bold text-white tracking-wide uppercase overflow-hidden whitespace-nowrap text-ellipsis" style={{maxWidth:"95%"}}>
                      {note.category ? note.category.name : "Uncategorized"}
                    </span>
                    {note.category && (
                      <button
                        onClick={() => removeCategoryFromNote(note.id)}
                        className="ml-auto rounded-full p-0.5"
                        title="Remove category"
                        style={{
                          background: 'none',
                          lineHeight: 0,
                          color: 'white',
                          opacity: 1
                        }}
                      >
                        <X size={16} />
                    </button>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">{note.content}</p>
                  <div className="text-xs text-gray-400 mb-3 mt-auto">Last updated: {formatDate(note.updated_at)}</div>
                  <div className="flex items-end justify-end space-x-2 mt-auto">
                    <button
                      onClick={() => openNoteModal(note)}
                      className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 transition rounded-lg"
                      title="Edit note"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 bg-red-100 text-red-600 hover:bg-red-200 transition rounded-lg"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>
      {showNoteModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
        >
          <div className="bg-white rounded-lg py-8 px-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto shadow-2xl border-2 border-blue-100 flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-lg font-semibold text-gray-1000">{editingNote ? 'Edit Note' : 'Add Note'}</h2>
              <button
                onClick={() => setShowNoteModal(false)}
                title="Close"
                className="p-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                style={{ border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleNoteSubmit} className="w-full max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={noteForm.title}
                  onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <div className="flex flex-wrap items-center gap-2">
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
                    <div className="flex flex-col sm:flex-row items-start gap-3 bg-gray-100 px-2 py-2 rounded border mt-1 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Category name"
                        value={noteForm.newCategoryName}
                        onChange={e =>
                          setNoteForm({ ...noteForm, newCategoryName: e.target.value })
                        }
                        className="border rounded px-2 py-1 text-xs flex-1 min-w-[78px]"
                        style={{ minWidth: 90 }}
                      />
                      <div style={{width:"120px"}}>
                        <HexColorPicker
                          color={noteForm.newCategoryColor}
                          onChange={color => setNoteForm({...noteForm, newCategoryColor: color})}
                          style={{width:"100px", height:"100px"}}
                        />
                      </div>
                    </div>
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
              <div className="flex justify-end mt-4">
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
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)'
          }}
        >
          <div className="bg-white rounded-lg py-8 px-6 w-full max-w-sm mx-4 shadow-2xl border-2 border-purple-100 flex flex-col items-center">
            <div className="flex justify-between items-center w-full mb-4">
              <h2 className="text-lg font-semibold text-gray-700 w-full text-left">Create Category</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                title="Close"
                className="p-1 rounded bg-gray-300 hover:bg-gray-400 transition-colors"
                style={{ border: 'none', color: '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="w-full max-w-xs space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <HexColorPicker
                    color={categoryForm.color}
                    onChange={color => setCategoryForm({...categoryForm, color})}
                    style={{width:"100px", height:"100px"}}
                  />
                  <span
                    className="ml-2 px-2 py-1 rounded text-xs font-mono border"
                    style={{background:categoryForm.color, color:"#fff", minWidth:58, textShadow:'0 1px 4px #333'}}
                  >
                    {categoryForm.color}
                  </span>
                </div>
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
  )
}
export default NotesApp