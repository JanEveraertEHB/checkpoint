import { Button } from '../common'
import type { Classroom } from '../../types'

interface ClassroomHeaderProps {
  classroom: Classroom
  onDemandFeedbackFromAll?: () => void
  onRequestFeedback?: () => void
}

export default function ClassroomHeader({ classroom, onDemandFeedbackFromAll, onRequestFeedback }: ClassroomHeaderProps) {
  const isTeacher = classroom.role === 'teacher'
  const isStudent = classroom.role === 'student'
  const isCompleted = classroom.completed === true
  const isActive = classroom.active !== false

  return (
    <>
      <div style={{ display: 'flex', padding: '50px', flexDirection: "column", gap: "20px", justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
        <div style={{ width: '100%' }}>
          <h2 style={{ marginBottom: '10px' }}>{classroom.name}</h2>
          <p style={{ marginBottom: 0 }}>
            <strong>Academic Year:</strong> {classroom.academic_year}<br />
            <strong>Teacher:</strong> {classroom.teacher_first_name} {classroom.teacher_last_name}<br />
            <strong>Your Role:</strong> {classroom.role}
            {classroom.allowed_email_domain && (
              <>
                <br />
                <strong>Allowed Email Domain:</strong> @{classroom.allowed_email_domain}
              </>
            )}
          </p>
        </div>
        {isTeacher && !isCompleted && onDemandFeedbackFromAll && (
          <Button variant="primary" onClick={onDemandFeedbackFromAll}>
            Demand Feedback from All Students
          </Button>
        )}
        {isStudent && !isCompleted && isActive && onRequestFeedback && (
          <Button variant="primary" onClick={onRequestFeedback}>
            Request Feedback from Teacher
          </Button>
        )}
      </div>
    </>
  )
}
