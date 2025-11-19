import { Link } from 'react-router-dom'
import icon from './../assets/icon.svg'

export default function Landing() {
  return (
   <div style={{ width: '100vw', height: '100vh', backgroundColor: '#ffe700', marginTop: '-50px', display: 'flex', justifyContent: 'center'}}>
    <div style={{display: 'flex', flexDirection:'column', height: '400px', marginTop: '20vh', textAlign: 'center', alignItems: 'center'}}>
      <img
        src={icon}
        alt="Checkpoint Academy Logo"
        style={{margin: 'auto'}}
      />
      <h1>
        Checkpoint Academy
      </h1>
      <p>
        A streamlined workspace where teachers set milestones and deliver precise feedback.
      </p>
      <Link to="/login" className="button-primary" style={{padding: '20px 10px', width: '150px'}}>
        Get Started
      </Link>
    </div>
  </div>

  )
}
