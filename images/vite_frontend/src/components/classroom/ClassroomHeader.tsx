import { Link } from 'react-router-dom'
import type { Classroom } from '../../types'

interface ClassroomHeaderProps {
  classroom: Classroom
}

export default function ClassroomHeader({ classroom }: ClassroomHeaderProps) {
  return (
    <>
      <Link to="/home">Back to My Classrooms</Link>
      <h2>{classroom.name}</h2>
      <p>
        <strong>Academic Year:</strong> {classroom.academic_year}<br />
        <strong>Teacher:</strong> {classroom.teacher_first_name} {classroom.teacher_last_name}<br />
        <strong>Your Role:</strong> {classroom.role}
      </p>
    </>
  )
}
