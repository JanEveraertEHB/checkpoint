import { useState, useEffect } from 'react'
import { getStudentEngagementMetrics } from '../services/api'

interface StudentEngagement {
  student_uuid: string
  first_name: string
  last_name: string
  email: string
  is_engaged: boolean
  current_checkpoint: string
  current_checkpoint_order: number
  reactivity_score: number
  dedication_score: number
  engagement_score: number
}

interface StudentEngagementTableProps {
  classroomUuid: string
}

export default function StudentEngagementTable({ classroomUuid }: StudentEngagementTableProps) {
  const [students, setStudents] = useState<StudentEngagement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchEngagementMetrics()
  }, [classroomUuid])

  const fetchEngagementMetrics = async () => {
    setLoading(true)
    setError('')
    
    try {
      const response = await getStudentEngagementMetrics(classroomUuid)
      setStudents(response.data.students)
    } catch (err) {
      console.error('Error fetching engagement metrics:', err)
      setError('Failed to load student engagement metrics')
    } finally {
      setLoading(false)
    }
  }

  const getEngagementColor = (score: number) => {
    if (score >= 80) return '#28a745' // green
    if (score >= 60) return '#ffc107' // yellow
    if (score >= 40) return '#fd7e14' // orange
    return '#dc3545' // red
  }

  const getReactivityColor = (score: number) => {
    if (score >= 80) return '#28a745'
    if (score >= 60) return '#ffc107'
    if (score >= 40) return '#fd7e14'
    return '#dc3545'
  }

  const getDedicationColor = (score: number) => {
    if (score >= 75) return '#28a745'
    if (score >= 50) return '#ffc107'
    if (score >= 25) return '#fd7e14'
    return '#dc3545'
  }

  if (loading) {
    return <div className="container"><p>Loading engagement metrics...</p></div>
  }

  if (error) {
    return (
      <div className="container">
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
          <button onClick={fetchEngagementMetrics} className="button">Retry</button>
        </div>
      </div>
    )
  }

  if (students && students.length === 0) {
    return (
      <div className="container">
        <p>No students found in this classroom.</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '20px' }}>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          Students are ranked by overall engagement score (lowest first). Students at the top may need more attention and support.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="u-full-width">
          <thead>
            <tr>
              <th>Student</th>
              <th>Engaged (7d)</th>
              <th>Current Checkpoint</th>
              <th>Reactivity</th>
              <th>Dedication</th>
              <th>Overall Score</th>
            </tr>
          </thead>
          <tbody>
            {students && students.map((student) => (
              <tr key={student.student_uuid} style={{
                backgroundColor: student.engagement_score < 40 ? '#fff5f5' : 
                               student.engagement_score < 60 ? '#fffbf0' : 'transparent'
              }}>
                <td>
                  <div>
                    <strong>{student.last_name}, {student.first_name}</strong>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {student.email}
                    </div>
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {student.is_engaged ? (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                  ) : (
                    <span style={{ color: '#dc3545' }}>✗</span>
                  )}
                </td>
                <td>
                  <div>
                    <strong style={{float: "left", marginRight: "10px"}}>{student.current_checkpoint_order}</strong>
                    {student.current_checkpoint_order > 0 && (
                      <div style={{ fontSize: '12px', color: '#6c757d', float: "left", marginTop: "3px"}}>
                        {student.current_checkpoint}
                      </div>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getReactivityColor(student.reactivity_score),
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '50px'
                  }}>
                    {student.reactivity_score}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                    {student.reactivity_score >= 80 ? 'Very Fast' :
                     student.reactivity_score >= 60 ? 'Fast' :
                     student.reactivity_score >= 40 ? 'Average' : 'Slow'}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getDedicationColor(student.dedication_score),
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '50px'
                  }}>
                    {student.dedication_score}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                    {student.dedication_score >= 75 ? 'Very Detailed' :
                     student.dedication_score >= 50 ? 'Detailed' :
                     student.dedication_score >= 25 ? 'Brief' : 'Minimal'}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: getEngagementColor(student.engagement_score),
                    color: 'white',
                    fontWeight: 'bold',
                    minWidth: '50px'
                  }}>
                    {student.engagement_score}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '2px' }}>
                    {student.engagement_score >= 75 ? 'High' :
                     student.engagement_score >= 50 ? 'Medium' :
                     student.engagement_score >= 25 ? 'Low' : 'Worrying'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h5>Understanding the Metrics</h5>
        <div className="row">
          <div className="four columns">
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              marginBottom: '15px'
            }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#495057' }}>Engaged (7d)</h6>
              <p style={{ margin: '0', fontSize: '13px', color: '#6c757d' }}>
                Student has had activity (feedback given or requested) in the last 7 days.
              </p>
            </div>
          </div>
          
          <div className="four columns">
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              marginBottom: '15px'
            }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#495057' }}>Reactivity</h6>
              <p style={{ margin: '0', fontSize: '13px', color: '#6c757d' }}>
                How quickly student responds to feedback requests. Based on average response time.
              </p>
            </div>
          </div>
          
          <div className="four columns">
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px',
              border: '1px solid #dee2e6',
              marginBottom: '15px'
            }}>
              <h6 style={{ margin: '0 0 10px 0', color: '#495057' }}>Dedication</h6>
              <p style={{ margin: '0', fontSize: '13px', color: '#6c757d' }}>
                Average length and elaboration of feedback content. Measures effort and detail.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}