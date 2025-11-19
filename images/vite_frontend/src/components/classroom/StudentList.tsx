import { Button } from '../common'
import { colors, spacing, typography } from '../../styles/theme'
import type { Student } from '../../types'

interface StudentListProps {
  students: Student[]
  selectedStudentUuid?: string
  onSelectStudent: (student: Student) => void
  onRemoveStudent?: (student: Student) => void
}

export default function StudentList({
  students,
  selectedStudentUuid,
  onSelectStudent,
  onRemoveStudent
}: StudentListProps) {
  if (students.length === 0) {
    return <p style={{ color: colors.textSecondary, padding: '50px' }}>No students yet. Share the invite code.</p>
  }

  // Sort: active students first, then inactive
  const sortedStudents = [...students].sort((a, b) => {
    const aActive = a.active !== false
    const bActive = b.active !== false
    if (aActive === bActive) return 0
    return aActive ? -1 : 1
  })

  return (
    <div style={{padding: '50px' }}>
      <h4 style={{ marginBottom: '10px' }}>Your students</h4>
      <ul style={{ listStyle: 'none'}}>
        {sortedStudents.map((student) => {
          const isActive = student.active !== false
          return (
            <li
              key={student.uuid}
              style={{
                marginBottom: spacing.xs,
                opacity: isActive ? 1 : 0.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{
                width: '100%', 
                cursor: 'pointer'
              }} onClick={() => onSelectStudent(student)}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  float: 'left',
                  margin: '8px',
                  borderRadius: '50%',
                  backgroundColor: selectedStudentUuid === student.uuid ? colors.black : colors.white
                }}></div>
                {student.first_name} {student.last_name}
                
                {!isActive && (
                  <span style={{ color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                    {' '}(inactive)
                  </span>

                )}
              </span>
              {onRemoveStudent && isActive && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveStudent(student)
                  }}
                >
                  Remove
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
