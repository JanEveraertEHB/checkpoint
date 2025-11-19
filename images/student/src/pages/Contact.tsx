import { useState } from 'react'
import type { FormEvent } from 'react'
import { sendContactMessage } from '../services/api'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSending(true)

    try {
      await sendContactMessage({ name, email, subject, message })
      setSuccess('Thank you for your message! We will get back to you soon.')
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setError('Failed to send message. Please try again later.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container single_container">
      <div className="row">
        <div className="eight columns offset-by-two">
          <h2>Contact Us</h2>
          <p>
            Have a question, remark, or inquiry? Fill out the form below and we'll get back to you as soon as possible.
          </p>

          {success && <p style={{ color: 'green' }}>{success}</p>}
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input
              className="u-full-width"
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              className="u-full-width"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="subject">Subject</label>
            <select
              className="u-full-width"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            >
              <option value="">Select a subject...</option>
              <option value="general">General Inquiry</option>
              <option value="support">Technical Support</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="other">Other</option>
            </select>

            <label htmlFor="message">Message</label>
            <textarea
              className="u-full-width"
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
            />

            <button className="button-primary" type="submit" disabled={sending}>
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
