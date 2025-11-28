import { Button } from '../common'
import { Link } from 'react-router-dom'
import type { Classroom } from '../../types'

interface ClassroomHeaderProps {
  classroom: Classroom
  onDemandFeedbackFromAll: () => void
}

export default function ClassroomHeader({ classroom, onDemandFeedbackFromAll }: ClassroomHeaderProps) {
  const isCompleted = classroom.completed === true

  return (
    <>
      <div style={{ display: 'flex', padding: '50px', flexDirection: "column", gap: "20px", justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ marginBottom: '10px' }}>{classroom.name}</h2>
          <p style={{ marginBottom: 0 }}>
            <strong>Academic Year:</strong> {classroom.academic_year}
            {classroom.allowed_email_domain && (
              <>
                <br />
                <strong>Allowed Email Domain:</strong> @{classroom.allowed_email_domain}
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isCompleted && (
            <Button variant="primary" onClick={onDemandFeedbackFromAll}>
              Demand Feedback from All Students
            </Button>
          )}
          {classroom.role === 'teacher' && (
            <Link to={`/classroom/${classroom.uuid}/metrics`} className="button">
              View Metrics
            </Link>
          )}
        </div>
      </div>
    </>
  )
}
