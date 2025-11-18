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
      position: 'sticky',
      top: '0px',
      zIndex: 1000,
      backgroundColor: '#F5E10E'
    }}>
      <div className="container navbar">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link to="/home" style={{ marginRight: '20px' }}>
              <span className="logo">C.A</span>
            </Link>
            <Link to="/home">Classrooms</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/profile">
              {user.first_name} {user.last_name}
            </Link>
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
            <a
              onClick={logout}
            >
              Logout
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
