import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getFeedbackRequests,
  resolveFeedbackRequest,
  deleteFeedbackRequest
} from '../services/api'
import { getClassrooms } from '../services/api'
import type { Classroom } from '../types'

interface FeedbackRequest {
  id: number
  uuid: string
  classroom_uuid: string
  student_uuid: string
  message: string | null
  resolved: boolean
  created_at: string
  resolved_at: string | null
  student_first_name: string
  student_last_name: string
  student_email: string
}

export default function Notifications() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState<string>('')
  const [requests, setRequests] = useState<FeedbackRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchClassrooms()
  }, [])

  useEffect(() => {
    if (selectedClassroom) {
      fetchRequests()
    }
  }, [selectedClassroom])

  const fetchClassrooms = async () => {
    try {
      const response = await getClassrooms()
      setClassrooms(response.data)
      const teacherClassrooms = response.data.filter(c => c.role === 'teacher')
      if (teacherClassrooms.length > 0) {
        setSelectedClassroom(teacherClassrooms[0].uuid)
      }
    } catch (err) {
      setError('Failed to load classrooms')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequests = async () => {
    if (!selectedClassroom) return
    try {
      const response = await getFeedbackRequests(selectedClassroom)
      setRequests(response.data)
    } catch (err) {
      setError('Failed to load feedback requests')
    }
  }

  const handleResolveRequest = async (requestUuid: string) => {
    try {
      await resolveFeedbackRequest(requestUuid)
      fetchRequests()
    } catch (err) {
      setError('Failed to resolve request')
    }
  }

  const handleDeleteRequest = async (requestUuid: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return
    try {
      await deleteFeedbackRequest(requestUuid)
      fetchRequests()
    } catch (err) {
      setError('Failed to delete request')
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  if (classrooms.length === 0) {
    return (
      <div className="container">
        <h2>Notifications</h2>
        <p>You don't have any classrooms yet.</p>
        <Link to="/home">Back to Home</Link>
      </div>
    )
  }

  const unresolvedRequests = requests.filter(r => !r.resolved)
  const resolvedRequests = requests.filter(r => r.resolved)

  return (
    <div className="single_container container">
      <div className="row">
        <div className="twelve columns">
          <h2>Notifications</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <h3 style={{ marginTop: '30px' }}>Feedback Requests from Students</h3>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="classroom">Select Classroom</label>
            <select
              id="classroom"
              className="u-full-width"
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
            >
              {classrooms.filter(c => c.role === 'teacher').map(classroom => (
                    <option key={classroom.uuid} value={classroom.uuid}>
                      {classroom.name} ({classroom.academic_year})
                    </option>
                  ))}
                </select>
              </div>

              {unresolvedRequests.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4>Pending Requests ({unresolvedRequests.length})</h4>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Message</th>
                        <th>Requested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unresolvedRequests.map(request => (
                        <tr key={request.uuid}>
                          <td>
                            <Link to={`/classroom/${request.classroom_uuid}`}>
                              {request.student_first_name} {request.student_last_name}
                            </Link>
                          </td>
                          <td>{request.message || <em>No message</em>}</td>
                          <td>{new Date(request.created_at).toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => handleResolveRequest(request.uuid)}
                              style={{ marginRight: '5px', fontSize: '12px' }}
                            >
                              Mark Done
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request.uuid)}
                              style={{ fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {unresolvedRequests.length === 0 && (
                <p style={{ color: '#666', marginBottom: '30px' }}>No pending feedback requests.</p>
              )}

              {resolvedRequests.length > 0 && (
                <details style={{ marginBottom: '30px' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                    <strong>Completed Requests ({resolvedRequests.length})</strong>
                  </summary>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Message</th>
                        <th>Requested</th>
                        <th>Resolved</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resolvedRequests.map(request => (
                        <tr key={request.uuid} style={{ opacity: 0.7 }}>
                          <td>{request.student_first_name} {request.student_last_name}</td>
                          <td>{request.message || <em>No message</em>}</td>
                          <td>{new Date(request.created_at).toLocaleString()}</td>
                          <td>{request.resolved_at ? new Date(request.resolved_at).toLocaleString() : '-'}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteRequest(request.uuid)}
                              style={{ fontSize: '12px' }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              )}
        </div>
      </div>
    </div>
  )
}
