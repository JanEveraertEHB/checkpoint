import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { getFeedbackRequestCount } from '../../services/api'
import icon from "./../../assets/icon.svg"

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
      // Fetch request count (when students request feedback from teachers)
      const requestResponse = await getFeedbackRequestCount().catch(() => ({ data: { count: 0 } }))
      setNotificationCount(requestResponse.data.count)
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
      backgroundColor: '#ffe700'
    }}>
      <div className="container navbar">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Link to="/" className="subtleLink" style={{float: 'left'}}>
              <img className="logo" src={icon} />
            </Link>

            <Link to="/home" style={{top: '7px', display: 'block', float: 'left', marginTop: '2px'}}>Classrooms</Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/profile">
              {user.first_name} {user.last_name}
            </Link>
            <Link to="/notifications" style={{ position: 'relative',padding: '0px',margin: '0px', height: '21px', marginRight: '20px' }}>
              <div className='flag icon'>&nbsp;</div>
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
