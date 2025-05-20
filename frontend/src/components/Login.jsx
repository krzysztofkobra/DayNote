import 'bootstrap/dist/css/bootstrap.min.css'
import '../styles/acc_styles.css'
import { useState } from 'react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

const csrfToken = getCookie('csrftoken')

const handleSubmit = async (e) => {
  e.preventDefault()
  const formData = new FormData()
  formData.append('username', username)
  formData.append('password', password)
  console.log('CSRF token:', csrfToken)

  try {
    const res = await fetch('http://localhost:8000/api/login/', {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrfToken,
      },
      body: formData,
      credentials: 'include',
    })

    if (res.ok) {
      const data = await res.json()
      if (data.status === 'ok') {
        window.location.href = '/'
      }
    } else {
      const data = await res.json()
      setError(data.error || 'Login failed')
    }
  } catch {
    setError('Login request failed')
  }
}

  return (
    <div className="container py-5">
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="username" className="form-label">Username</label>
          <input type="text" id="username" name="username" className="form-control"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input type="password" id="password" name="password" className="form-control"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary w-100">Login</button>

        <div id="g_id_onload" className="mt-3 w-100"
             data-client_id="308372104322-7fiej93q3a3i4mgrq2b1n5rua41sc0ok.apps.googleusercontent.com"
             data-context="signin"
             data-ux_mode="redirect"
             data-login_uri="http://localhost:8000/api/auth-receiver/"
             data-auto_prompt="false">
        </div>

        <div className="g_id_signin mt-3 w-100"
             data-type="standard"
             data-shape="rectangular"
             data-theme="filled_black"
             data-text="signin_with"
             data-size="large"
             data-logo_alignment="left">
        </div>
      </form>
      {error && <p className="text-danger mt-3">{error}</p>}
      <p className="mt-3 text-center">
        Don't have an account? <a href="/register">Register here</a>
      </p>
    </div>
  )
}
