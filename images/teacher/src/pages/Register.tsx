import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userType, setUserType] = useState<'student' | 'teacher'>('student')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await register(firstName, lastName, email, password, userType)

      // Redirect based on user type
      if (userType === 'student') {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        if (isLocalhost) {
          window.location.href = 'http://localhost:5174/home'
        } else {
          window.location.href = 'https://student.checkpoint.academy/home'
        }
      } else {
        navigate('/home')
      }
    } catch (err: any) {
      // Check if the error response contains a message about duplicate email
      if (err.response?.data?.message === 'Email already in use') {
        setError('This email address is already registered. Please use a different email or try logging in.')
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="row">
        <div className="six columns offset-by-three">
          <h2>Register</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="six columns">
                <label htmlFor="firstName">First Name</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="six columns">
                <label htmlFor="lastName">Last Name</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <label>I am a:</label>
            <div>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="student"
                  checked={userType === 'student'}
                  onChange={(e) => setUserType(e.target.value as 'student' | 'teacher')}
                />
                <span className="label-body">Student</span>
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="userType"
                  value="teacher"
                  checked={userType === 'teacher'}
                  onChange={(e) => setUserType(e.target.value as 'student' | 'teacher')}
                />
                <span className="label-body">Teacher</span>
              </label>
            </div>

            <label htmlFor="email">Email</label>
            <input
              className="u-full-width"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="password">Password</label>
            <input
              className="u-full-width"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="button-primary u-full-width" type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
