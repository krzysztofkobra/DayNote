import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import CalendarApp from './components/Calendar'
import Notes from './components/Notes'
import Account from './components/Account'
import Logout from './components/Logout'
import SettingsPage from './components/Settings'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/account" element={<Account />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<CalendarApp />}/>
      </Routes>
    </Router>
  )
}

export default App