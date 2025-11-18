import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="single_container container footer">
        <div className="row">
          <div className="four columns">
            <h6>Support</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/faq">FAQ</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><a href="#">Help Center</a></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Legal</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/gdpr">GDPR</Link></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Follow Us</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#aaa' }}>
          &copy; {new Date().getFullYear()} Checkpoint. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
