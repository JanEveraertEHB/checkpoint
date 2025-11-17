import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      padding: '20px 0',
      marginTop: '40px',
      borderTop: '1px solid #ddd'
    }}>
      <div className="container">
        <div className="row">
          <div className="four columns">
            <h6>Support</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#" style={{ color: '#666' }}>FAQ</a></li>
              <li><Link to="/contact" style={{ color: '#666' }}>Contact Us</Link></li>
              <li><a href="#" style={{ color: '#666' }}>Help Center</a></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Legal</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#" style={{ color: '#666' }}>Terms & Conditions</a></li>
              <li><a href="#" style={{ color: '#666' }}>Privacy Policy</a></li>
              <li><a href="#" style={{ color: '#666' }}>GDPR</a></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Follow Us</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#" style={{ color: '#666' }}>Twitter</a></li>
              <li><a href="#" style={{ color: '#666' }}>LinkedIn</a></li>
              <li><a href="#" style={{ color: '#666' }}>GitHub</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#999', fontSize: '14px' }}>
          &copy; {new Date().getFullYear()} Checkpoint. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
