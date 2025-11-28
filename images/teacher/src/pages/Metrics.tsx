import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getClassroom, getClassroomMetrics } from '../services/api'
import StudentEngagementTable from '../components/StudentEngagementTable'
import type { Classroom } from '../types'

interface ClassroomMetrics {
  total_students: number
  active_students: number
  checkpoint_achievements: {
    checkpoint_name: string
    achieved_count: number
    total_count: number
  }[]
  overall_participation: number
}

export default function Metrics() {
  const { uuid } = useParams<{ uuid: string }>()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [metrics, setMetrics] = useState<ClassroomMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (uuid) {
      fetchClassroomData()
    }
  }, [uuid])

  const fetchClassroomData = async () => {
    if (!uuid) return
    
    setLoading(true)
    setError('')
    
    try {
      const [classroomResponse, metricsResponse] = await Promise.all([
        getClassroom(uuid),
        getClassroomMetrics(uuid)
      ])
      
      setClassroom(classroomResponse.data)
      setMetrics(metricsResponse.data)
      
      // Verify teacher access
      if (classroomResponse.data.role !== 'teacher') {
        setError('Access denied. Only teachers can view classroom metrics.')
      }
    } catch (err) {
      console.error('Error fetching classroom data:', err)
      setError('Failed to load classroom metrics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading metrics...</p></div>
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
          <Link to="/home" className="button">Back to Home</Link>
        </div>
      </div>
    )
  }

  if (!classroom || !metrics) {
    return <div className="container"><p>Classroom not found</p></div>
  }

  return (
    <div className="container" style={{maxWidth: "1000px"}}>
      <div className="row">
        <div className="twelve columns">
          <div style={{ marginBottom: '30px' }}>
            <Link to={`/classroom/${uuid}`} className="button" style={{ marginRight: '10px' }}>
              ← Back to Classroom
            </Link><br />
            <h3 style={{ display: 'inline', marginLeft: '10px' }}>
              Metrics - {classroom.name}
            </h3>
          </div>

          {/* Overview Cards */}
          <div className="row" style={{ marginBottom: '40px' }}>
            <div className="one-third column">
              <div className="metric-card" style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Total Students</h5>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#007bff' }}>
                  {metrics.total_students}
                </div>
                <small style={{ color: '#6c757d' }}>
                  In this class
                </small>
              </div>
            </div>
            
            <div className="one-third column">
              <div className="metric-card" style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Active Students</h5>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#28a745' }}>
                  {metrics.active_students}
                </div>
                <small style={{ color: '#6c757d' }}>
                  last 7 days
                </small>
              </div>
            </div>
            
            <div className="one-third column">
              <div className="metric-card" style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: '1px solid #dee2e6'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#6c757d' }}>Participation Rate</h5>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ffc107' }}>
                  {metrics.overall_participation}%
                </div>
                <small style={{ color: '#6c757d' }}>
                  overall activity
                </small>
              </div>
            </div>
          </div>

          {/* Checkpoint Achievements */}
          <div style={{ marginBottom: '40px' }}>
            <h4>Checkpoint Progress</h4>
            {metrics.checkpoint_achievements.length === 0 ? (
              <p>No checkpoints created yet.</p>
            ) : (
              <table className="u-full-width">
                <thead>
                  <tr>
                    <th>Checkpoint</th>
                    <th>Achieved</th>
                    <th>Total</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.checkpoint_achievements.map((checkpoint, index) => (
                    <tr key={index}>
                      <td>{checkpoint.checkpoint_name}</td>
                      <td>{checkpoint.achieved_count}</td>
                      <td>{checkpoint.total_count}</td>
                      <td>
                        <div style={{ 
                          background: '#e9ecef', 
                          borderRadius: '4px', 
                          height: '20px', 
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: checkpoint.achieved_count === checkpoint.total_count ? '#28a745' : '#007bff',
                            height: '100%',
                            width: `${checkpoint.total_count > 0 ? (checkpoint.achieved_count / checkpoint.total_count) * 100 : 0}%`,
                            transition: 'width 0.3s ease'
                          }} />
                          <span style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            {checkpoint.total_count > 0 ? Math.round((checkpoint.achieved_count / checkpoint.total_count) * 100) : 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Additional Insights */}
          <div>
            <h4>Class Insights</h4>
            <div className="row">
              <div className="six columns">
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h6 style={{ margin: '0 0 10px 0' }}>Student Activity</h6>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    {metrics.active_students > 0 
                      ? `${((metrics.active_students / metrics.total_students) * 100).toFixed(1)}% of students have been active in the last week.`
                      : 'No student activity in the last week.'
                    }
                  </p>
                </div>
              </div>
              
              <div className="six columns">
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #dee2e6'
                }}>
                  <h6 style={{ margin: '0 0 10px 0' }}>Class Engagement</h6>
                  <p style={{ margin: '0', fontSize: '14px' }}>
                    {metrics.overall_participation >= 70 
                      ? 'High engagement - students are actively participating!'
                      : metrics.overall_participation >= 40
                      ? 'Moderate engagement - consider encouraging more participation.'
                      : 'Low engagement - may need intervention to boost participation.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Engagement Table */}
          <div style={{ marginTop: '50px' }}>
            <h4>Student Engagement Analysis</h4>
            <StudentEngagementTable classroomUuid={uuid!} />
          </div>
        </div>
      </div>
    </div>
  )
}