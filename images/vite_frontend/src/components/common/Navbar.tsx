import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getFeedbackRequestCount, getFeedbackDemandCount } from '../../services/api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const [notificationCount, setNotificationCount] = useState(0)

  useEffect(() => {
    if (user) {
      fetchNotificationCount()
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const fetchNotificationCount = async () => {
    try {
      // Fetch both request count (for teachers) and demand count (for students)
      const [requestResponse, demandResponse] = await Promise.all([
        getFeedbackRequestCount().catch(() => ({ data: { count: 0 } })),
        getFeedbackDemandCount().catch(() => ({ data: { count: 0 } }))
      ])

      // Show the total of both types
      setNotificationCount(requestResponse.data.count + demandResponse.data.count)
    } catch (err) {
      console.error('Error fetching notification count:', err)
    }
  }

  if (!user) {
    return null
  }

  return (
    <nav style={{
      backgroundColor: '#FFFFFF',
      padding: '10px 0',
      borderBottom: '1px solid #ddd',
      position: 'sticky',
      top: '0px',
      zIndex: 1000
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link to="/home" style={{ marginRight: '20px', fontWeight: 'bold', textDecoration: 'none' }}>
              Checkpoint
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#666' }}>
              {user.first_name} {user.last_name}
            </span>
            <Link to="/home">Classrooms</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/notifications" style={{ position: 'relative' }}>
              Notifications
              {notificationCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              style={{
                background: 'none',
                border: '1px solid #999',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
