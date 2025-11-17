import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="container">
      <header className="row" style={{ marginTop: '4rem' }}>
        <div className="twelve columns">
          <h1>Checkpoints to Learn</h1>
          <p>Your workspace for learning, feedback, and progress tracking.</p>
                  <Link className="button button-primary" to="/login">Get Started</Link>
</div>
      </header>

      <section className="row" style={{ marginTop: '3rem' }}>
        <div className="twelve columns">
          <img src="https://placehold.co/1200x300" alt="Hero" style={{ width: '100%', height: 'auto' }} />
        </div>
      </section>

      <section className="row" style={{ marginTop: '3rem' }}>
        <div className="six columns">
          <h4>Self-Paced Learning</h4>
          <p>Track your progress through structured checkpoints. Teachers set clear goals, and you advance at your own pace while receiving meaningful feedback along the way.</p>
          <p>Stay motivated by seeing your achievements and knowing exactly what comes next in your learning journey.</p>
        </div>
        <div className="six columns">
          <img src="https://placehold.co/600x350" alt="Learning" style={{ width: '100%', height: 'auto' }} />
        </div>
      </section>

      <section className="row" style={{ marginTop: '3rem' }}>
        <div className="four columns">
          <img src="https://placehold.co/400x250" alt="Feedback" style={{ width: '100%', height: 'auto' }} />
          <h4>Rich Feedback</h4>
          <p>Receive and record detailed feedback with formatting, links, and more.</p>
          <Link className="button" to="/login">Open</Link>
        </div>
        <div className="four columns">
          <img src="https://placehold.co/400x250" alt="Classrooms" style={{ width: '100%', height: 'auto' }} />
          <h4>Classroom Management</h4>
          <p>Create classrooms, invite students, and manage progress all in one place.</p>
          <Link className="button" to="/login">Browse</Link>
        </div>
        <div className="four columns">
          <img src="https://placehold.co/400x250" alt="Checkpoints" style={{ width: '100%', height: 'auto' }} />
          <h4>Goal Checkpoints</h4>
          <p>Track progress through structured steps and learn at your own pace.</p>
          <Link className="button button-primary" to="/login">Get Started</Link>
        </div>
      </section>

      <footer className="row" style={{ marginTop: '4rem', marginBottom: '2rem' }}>
        <div className="twelve columns">
          <p>&copy; 2025 Checkpoints to Learn</p>
        </div>
      </footer>
    </div>
  )
}
