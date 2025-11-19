import { Button } from '../common'
import type { Classroom } from '../../types'

interface ClassroomHeaderProps {
  classroom: Classroom
  onRequestFeedback: () => void
}

export default function ClassroomHeader({ classroom, onRequestFeedback }: ClassroomHeaderProps) {
  const isCompleted = classroom.completed === true
  const isActive = classroom.active !== false

  return (
    <div className="container">
      <div style={{ display: 'flex', flexDirection: "column", gap: "20px", justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ marginBottom: '10px' }}>{classroom.name}</h2>
          <p style={{ marginBottom: 0 }}>
            <strong>Academic Year:</strong> {classroom.academic_year}<br />
            <strong>Teacher:</strong> {classroom.teacher_first_name} {classroom.teacher_last_name}
            {classroom.allowed_email_domain && (
              <>
                <br />
                <strong>Allowed Email Domain:</strong> @{classroom.allowed_email_domain}
              </>
            )}
          </p>
        </div>
        {!isCompleted && isActive && (
          <Button variant="primary" onClick={onRequestFeedback}>
            Request Feedback from Teacher
          </Button>
        )}
      </div>
    </div>
  )
}
