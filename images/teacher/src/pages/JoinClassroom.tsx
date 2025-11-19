import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { joinClassroom } from '../services/api'

export default function JoinClassroom() {
  const { invite_code } = useParams<{ invite_code: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (invite_code && user) {
      handleJoin()
    }
  }, [invite_code, user])

  const handleJoin = async () => {
    if (!invite_code) return

    setLoading(true)
    setError('')

    try {
      await joinClassroom(invite_code)
      setSuccess(true)
      setTimeout(() => {
        navigate('/home')
      }, 2000)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } }
        if (axiosError.response?.data?.message === 'Already a member of this classroom') {
          setError('You are already a member of this classroom')
        } else {
          setError('Invalid invite code or failed to join classroom')
        }
      } else {
        setError('Invalid invite code or failed to join classroom')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container">
        <div className="row">
          <div className="six columns offset-by-three">
            <h2>Join Classroom</h2>
            <p>You need to be logged in to join a classroom.</p>
            <p>
              <Link to="/login">Login</Link> or <Link to="/register">Register</Link> first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row">
        <div className="six columns offset-by-three">
          <h2>Join Classroom</h2>
          {loading && <p>Joining classroom...</p>}
          {error && (
            <div>
              <p style={{ color: 'red' }}>{error}</p>
              <Link to="/home">Go to My Classrooms</Link>
            </div>
          )}
          {success && (
            <div>
              <p style={{ color: 'green' }}>Successfully joined the classroom!</p>
              <p>Redirecting to your classrooms...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
