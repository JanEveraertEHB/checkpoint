import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  return (
    <nav style={{
      backgroundColor: '#FFFFFF',
      padding: '10px 0',
      marginBottom: '20px',
      borderBottom: '1px solid #ddd'
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
