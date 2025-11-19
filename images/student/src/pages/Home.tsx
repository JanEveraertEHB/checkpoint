import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getClassrooms, joinClassroom } from '../services/api'
import type { Classroom } from '../types'

export default function Home() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClassrooms()
  }, [])

  const fetchClassrooms = async () => {
    try {
      const response = await getClassrooms()
      setClassrooms(response.data)
    } catch (err) {
      console.error('Error fetching classrooms:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinClassroom = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await joinClassroom(inviteCode)
      setInviteCode('')
      setShowJoinForm(false)
      fetchClassrooms()
    } catch (err) {
      setError('Invalid invite code or already a member')
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  return (
    <div className="single_container container">
      <div className="row">
        <div className="twelve columns">
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between'}}>
            <h4>Current classes</h4>
            <button className="button-primary" onClick={() => setShowJoinForm(!showJoinForm)}>
              Join a class
            </button>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {showJoinForm && (
            <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd' }}>
              <h4>Join Classroom</h4>
              <form onSubmit={handleJoinClassroom}>
                <label htmlFor="inviteCode">Invite Code</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
                <button className="button-primary" type="submit">Join</button>
                <button type="button" onClick={() => setShowJoinForm(false)} style={{ marginLeft: '10px' }}>
                  Cancel
                </button>
              </form>
            </div>
          )}

          {classrooms.length === 0 ? (
            <p>No classrooms yet. Join with an invite code.</p>
          ) : (
            <>
              {classrooms.filter(c => c.role === 'student' && !c.completed).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Academic Year</th>
                        <th>Teacher</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classrooms
                        .filter((classroom) => classroom.role === 'student' && !classroom.completed)
                        .map((classroom) => (
                          <tr key={classroom.uuid}>
                            <td>{classroom.name}</td>
                            <td>{classroom.academic_year}</td>
                            <td>{classroom.teacher_first_name} {classroom.teacher_last_name}</td>
                            <td>
                              <Link to={`/classroom/${classroom.uuid}`}>View</Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {classrooms.filter(c => c.completed && c.role === 'student').length > 0 && (
                <div style={{ marginBottom: '30px', marginTop: '50px', opacity: 0.2 }}>
                  <h4>Past classes</h4>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Academic Year</th>
                        <th>Teacher</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classrooms
                        .filter((classroom) => classroom.completed && classroom.role === 'student')
                        .map((classroom) => (
                          <tr key={classroom.uuid} style={{ opacity: 0.7 }}>
                            <td>{classroom.name}</td>
                            <td>{classroom.academic_year}</td>
                            <td>{classroom.teacher_first_name} {classroom.teacher_last_name}</td>
                            <td>
                              <Link to={`/classroom/${classroom.uuid}`}>View</Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
