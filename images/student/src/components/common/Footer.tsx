import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer>
      <div className="single_container container footer">
        <div className="row">
          <div className="four columns">
            <h6>Support</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/faq" className="footerLink">FAQ</Link></li>
              <li><Link to="/contact" className="footerLink">Contact Us</Link></li>
              <li><a href="/contact" className="footerLink">Help Center</a></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Legal</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/terms" className="footerLink">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="footerLink">Privacy Policy</Link></li>
              <li><Link to="/gdpr" className="footerLink">GDPR</Link></li>
            </ul>
          </div>
          <div className="four columns">
            <h6>Follow Us</h6>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="#" className="footerLink">Twitter</a></li>
              <li><a href="#" className="footerLink">LinkedIn</a></li>
              <li><a href="#" className="footerLink">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', color: 'rgba(0, 0, 0, 0.3)' }}>
          &copy; {new Date().getFullYear()} Checkpoint. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
