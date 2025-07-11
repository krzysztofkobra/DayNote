import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/acc_styles.css'
import { useState, useEffect } from 'react'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [error, setError] = useState(null)

  function getCookie(name) {
    const cookies = document.cookie.split(';').map(c => c.trim())
    for (let cookie of cookies) {
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.split('=')[1])
      }
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== password2) {
      setError('Passwords do not match')
      return
    }
    const csrfToken = getCookie('csrftoken')
    const payload = { username, password }

    try {
      const res = await fetch('http://localhost:8000/api/register/', {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'ok') {
          window.location.href = '/login'
        } else {
          setError(data.error || 'Registration failed')
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Registration request failed')
    }
  }

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      document.body.appendChild(script)
      script.onload = renderGoogleButton
    } else {
      renderGoogleButton()
    }
    function renderGoogleButton() {
      if (window.google && document.getElementById('g_id_signin')) {
        window.google.accounts.id.initialize({
          client_id: "308372104322-7fiej93q3a3i4mgrq2b1n5rua41sc0ok.apps.googleusercontent.com",
          ux_mode: "redirect",
          login_uri: "http://localhost:8000/api/auth-receiver/"
        })
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          {
            theme: "filled_black",
            size: "large",
            width: "100%",
            shape: "rectangular",
            logo_alignment: "left",
            text: "signin_with"
          }
        )
      }
    }
  }, [])

  return (
    <div className="login-bg">
      <div className="d-flex align-items-center justify-content-center min-vh-100">
        <div className="glassmorph p-5 rounded-4 shadow-lg" style={{maxWidth: 410, width: "100%"}}>
          <h2 className="mb-4 text-center fw-semibold" style={{letterSpacing:1}}>Register</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input type="text" id="username" name="username" className="form-control"
                value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input type="password" id="password" name="password" className="form-control"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label htmlFor="password2" className="form-label">Repeat Password</label>
              <input type="password" id="password2" name="password2" className="form-control"
                value={password2} onChange={e => setPassword2(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100 mb-3 fw-semibold">Register</button>
            <div className="w-100 mb-2" id="g_id_signin"></div>
          </form>
          {error && <p className="text-danger mt-3">{error}</p>}
          <p className="mt-3 text-center text-secondary">
            Already have an account? <a href="/login">Login here</a>
          </p>
        </div>
      </div>
    </div>
  )
}