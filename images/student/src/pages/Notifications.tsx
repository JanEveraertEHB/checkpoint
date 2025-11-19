import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  getFeedbackDemands,
  fulfillFeedbackDemand,
  deleteFeedbackDemand
} from '../services/api'

interface FeedbackDemand {
  id: number
  uuid: string
  classroom_uuid: string
  student_uuid: string
  teacher_uuid: string
  message: string | null
  fulfilled: boolean
  created_at: string
  fulfilled_at: string | null
  teacher_first_name: string
  teacher_last_name: string
  classroom_name: string
}

export default function Notifications() {
  const [demands, setDemands] = useState<FeedbackDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDemands()
  }, [])

  const fetchDemands = async () => {
    try {
      const response = await getFeedbackDemands()
      setDemands(response.data)
    } catch (err) {
      setError('Failed to load feedback demands')
    } finally {
      setLoading(false)
    }
  }

  const handleFulfillDemand = async (demandUuid: string) => {
    try {
      await fulfillFeedbackDemand(demandUuid)
      fetchDemands()
    } catch (err) {
      setError('Failed to mark demand as fulfilled')
    }
  }

  const handleDeleteDemand = async (demandUuid: string) => {
    if (!confirm('Are you sure you want to delete this demand?')) return
    try {
      await deleteFeedbackDemand(demandUuid)
      fetchDemands()
    } catch (err) {
      setError('Failed to delete demand')
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  const unfulfilledDemands = demands.filter(d => !d.fulfilled)
  const fulfilledDemands = demands.filter(d => d.fulfilled)

  return (
    <div className="single_container container">
      <div className="row">
        <div className="twelve columns">
          <h2>Notifications</h2>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          <h3 style={{ marginTop: '30px' }}>Feedback Demands from Teachers</h3>

          {unfulfilledDemands.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4>Pending Demands ({unfulfilledDemands.length})</h4>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Classroom</th>
                        <th>Teacher</th>
                        <th>Message</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unfulfilledDemands.map(demand => (
                        <tr key={demand.uuid}>
                          <td>
                            <Link to={`/classroom/${demand.classroom_uuid}`}>
                              {demand.classroom_name}
                            </Link>
                          </td>
                          <td>{demand.teacher_first_name} {demand.teacher_last_name}</td>
                          <td>{demand.message || <em>No message</em>}</td>
                          <td>{new Date(demand.created_at).toLocaleString()}</td>
                          <td>
                            <button
                              onClick={() => handleFulfillDemand(demand.uuid)}
                              style={{ marginRight: '5px', fontSize: '12px' }}
                            >
                              Mark Done
                            </button>
                            <button
                              onClick={() => handleDeleteDemand(demand.uuid)}
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

              {unfulfilledDemands.length === 0 && (
                <p style={{ color: '#666', marginBottom: '30px' }}>No pending feedback demands.</p>
              )}

              {fulfilledDemands.length > 0 && (
                <details style={{ marginBottom: '30px' }}>
                  <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                    <strong>Completed Demands ({fulfilledDemands.length})</strong>
                  </summary>
                  <table className="u-full-width">
                    <thead>
                      <tr>
                        <th>Classroom</th>
                        <th>Teacher</th>
                        <th>Message</th>
                        <th>Created</th>
                        <th>Fulfilled</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fulfilledDemands.map(demand => (
                        <tr key={demand.uuid} style={{ opacity: 0.7 }}>
                          <td>{demand.classroom_name}</td>
                          <td>{demand.teacher_first_name} {demand.teacher_last_name}</td>
                          <td>{demand.message || <em>No message</em>}</td>
                          <td>{new Date(demand.created_at).toLocaleString()}</td>
                          <td>{demand.fulfilled_at ? new Date(demand.fulfilled_at).toLocaleString() : '-'}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteDemand(demand.uuid)}
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
