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
    return <p>No students yet. Share the invite code.</p>
  }

  // Sort: active students first, then inactive
  const sortedStudents = [...students].sort((a, b) => {
    const aActive = a.active !== false
    const bActive = b.active !== false
    if (aActive === bActive) return 0
    return aActive ? -1 : 1
  })

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {sortedStudents.map((student) => {
        const isActive = student.active !== false
        return (
          <li
            key={student.uuid}
            style={{
              padding: '10px',
              marginBottom: '5px',
              backgroundColor: selectedStudentUuid === student.uuid ? '#ddd' : '#f9f9f9',
              cursor: 'pointer',
              opacity: isActive ? 1 : 0.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span onClick={() => onSelectStudent(student)}>
              {student.first_name} {student.last_name}
              {!isActive && <span style={{ color: '#999', fontSize: '0.8rem' }}> (inactive)</span>}
            </span>
            {onRemoveStudent && isActive && (
              <a
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveStudent(student)
                }}
                style={{
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                Remove
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
