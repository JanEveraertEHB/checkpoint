import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getClassrooms, createClassroom } from '../services/api'
import type { Classroom } from '../types'

export default function Home() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [academicYear, setAcademicYear] = useState('')
  const [allowedEmailDomain, setAllowedEmailDomain] = useState('')
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

  const handleCreateClassroom = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createClassroom(name, academicYear, allowedEmailDomain || undefined)
      setName('')
      setAcademicYear('')
      setAllowedEmailDomain('')
      setShowCreateForm(false)
      fetchClassrooms()
    } catch (err) {
      setError('Failed to create classroom')
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  return (
    <div className="single_container container">
      <div className="row">
        <div className="twelve columns">
          <div style={{ display: 'flex', justifyContent: 'space-between'}}>

            <h4>Current classes</h4>
            <button
              className="button-primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              Create Classroom
            </button>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {showCreateForm && (
            <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd' }}>
              <h4>Create New Classroom</h4>
              <form onSubmit={handleCreateClassroom}>
                <label htmlFor="name">Classroom Name</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <label htmlFor="academicYear">Academic Year</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="academicYear"
                  placeholder="e.g., 2024-2025"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  required
                />
                <label htmlFor="allowedEmailDomain">Allowed Email Domain (optional)</label>
                <input
                  className="u-full-width"
                  type="text"
                  id="allowedEmailDomain"
                  placeholder="e.g., student.ehb.be (leave empty for no restriction)"
                  value={allowedEmailDomain}
                  onChange={(e) => setAllowedEmailDomain(e.target.value)}
                />
                <small style={{ color: '#666', display: 'block', marginBottom: '10px' }}>
                  If set, only users with email addresses ending in @{allowedEmailDomain || 'domain.com'} can join
                </small>
                <button className="button-primary" type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateForm(false)} style={{ marginLeft: '10px' }}>
                  Cancel
                </button>
              </form>
            </div>
          )}

          {classrooms.length === 0 ? (
            <p>No classrooms yet. Create one to get started.</p>
          ) : (
            <>
              {classrooms.filter(c => c.role === 'teacher' && !c.completed).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Academic Year</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classrooms
                        .filter((classroom) => classroom.role === 'teacher' && !classroom.completed)
                        .map((classroom) => (
                          <tr key={classroom.uuid}>
                            <td>{classroom.name}</td>
                            <td>{classroom.academic_year}</td>
                            <td>
                              <Link to={`/classroom/${classroom.uuid}`}>View</Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {classrooms.filter(c => c.completed && c.role === 'teacher').length > 0 && (
                <div style={{ marginBottom: '30px', marginTop: '50px', opacity: 0.2 }}>
                  <h4>Completed Classrooms</h4>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Academic Year</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classrooms
                        .filter((classroom) => classroom.completed && classroom.role === 'teacher')
                        .map((classroom) => (
                          <tr key={classroom.uuid} style={{ opacity: 0.7 }}>
                            <td>{classroom.name}</td>
                            <td>{classroom.academic_year}</td>
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
