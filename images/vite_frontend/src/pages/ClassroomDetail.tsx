import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useClassroom, useCheckpoints, useFeedback, useTimeline } from '../hooks'
import { Loading } from '../components/common'
import { ClassroomHeader, TeacherView, StudentView } from '../components/classroom'
import { removeStudentFromClassroom, leaveClassroom, rejoinClassroom, completeClassroom } from '../services/api'
import type { Student } from '../types'

export default function ClassroomDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { user } = useAuth()
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [newFeedback, setNewFeedback] = useState('')

  // Custom hooks for data management
  const {
    classroom,
    loading,
    error: classroomError,
    setError: setClassroomError,
    inviteCode,
    showInviteCode,
    fetchInviteCode,
    refreshClassroom
  } = useClassroom(uuid)

  const {
    checkpoints,
    studentProgress,
    nextCheckpoint,
    error: checkpointError,
    fetchCheckpoints,
    fetchStudentProgress,
    addCheckpoint,
    removeCheckpoint,
    toggleCheckpointReached
  } = useCheckpoints(uuid)

  const {
    feedback,
    editingFeedbackUuid,
    editFeedbackContent,
    uploadingImagesFeedbackUuid,
    error: feedbackError,
    setEditFeedbackContent,
    setUploadingImagesFeedbackUuid,
    fetchMyFeedback,
    fetchStudentFeedback,
    addFeedback,
    saveFeedbackEdit,
    toggleFeedbackLock,
    uploadImages,
    deleteImage,
    startEditFeedback,
    cancelEditFeedback,
    canEditFeedback,
    canAddImagesToFeedback
  } = useFeedback(uuid)

  const timelineItems = useTimeline(feedback, studentProgress)

  // Combine errors
  const error = classroomError || checkpointError || feedbackError

  // Fetch data when classroom loads
  useEffect(() => {
    if (classroom && uuid) {
      fetchCheckpoints()
      if (classroom.role === 'student' && user) {
        fetchMyFeedback()
        fetchStudentProgress(user.uuid)
      }
    }
  }, [classroom, user, uuid])

  // Handle student selection (teacher view)
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    fetchStudentFeedback(student.uuid)
    fetchStudentProgress(student.uuid)
  }

  // Handle adding feedback
  const handleAddFeedback = async () => {
    const studentUuid = classroom?.role === 'teacher' ? selectedStudent?.uuid : user?.uuid
    if (!studentUuid) return

    await addFeedback(studentUuid, newFeedback)
    setNewFeedback('')

    if (classroom?.role === 'teacher' && selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    } else {
      fetchMyFeedback()
    }
  }

  // Handle saving feedback edit
  const handleSaveEditFeedback = async () => {
    await saveFeedbackEdit()
    if (classroom?.role === 'teacher' && selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    } else {
      fetchMyFeedback()
    }
  }

  // Handle toggling checkpoint
  const handleToggleCheckpoint = async (checkpointUuid: string, reached: boolean) => {
    if (!selectedStudent) return
    await toggleCheckpointReached(checkpointUuid, selectedStudent.uuid, reached)
    fetchStudentFeedback(selectedStudent.uuid)
  }

  // Handle deleting checkpoint
  const handleDeleteCheckpoint = async (checkpointUuid: string) => {
    await removeCheckpoint(checkpointUuid)
    if (selectedStudent) {
      fetchStudentProgress(selectedStudent.uuid)
    }
  }

  // Handle toggling feedback lock
  const handleToggleLockFeedback = async (feedbackUuid: string, currentLocked: boolean) => {
    await toggleFeedbackLock(feedbackUuid, currentLocked)
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    }
  }

  // Handle image upload
  const handleImageUpload = async (feedbackUuid: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    await uploadImages(feedbackUuid, files)
    if (classroom?.role === 'teacher' && selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    } else {
      fetchMyFeedback()
    }
  }

  // Handle image deletion
  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    await deleteImage(imageUuid)
    if (classroom?.role === 'teacher' && selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    } else {
      fetchMyFeedback()
    }
  }

  // Handle removing student from classroom (teacher only)
  const handleRemoveStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to remove ${student.first_name} ${student.last_name} from this classroom?`)) {
      return
    }

    try {
      await removeStudentFromClassroom(uuid!, student.uuid)
      refreshClassroom()
      if (selectedStudent?.uuid === student.uuid) {
        setSelectedStudent(null)
      }
    } catch (err) {
      setClassroomError('Failed to remove student')
    }
  }

  // Handle leaving classroom (student only)
  const handleLeaveClassroom = async () => {
    if (!confirm('Are you sure you want to leave this classroom? You will still be able to view your feedback history.')) {
      return
    }

    try {
      await leaveClassroom(uuid!)
      refreshClassroom()
    } catch (err) {
      setClassroomError('Failed to leave classroom')
    }
  }

  // Handle rejoining classroom (student only)
  const handleRejoinClassroom = async () => {
    try {
      await rejoinClassroom(uuid!)
      refreshClassroom()
    } catch (err) {
      setClassroomError('Failed to rejoin classroom')
    }
  }

  // Handle marking classroom as completed (teacher only)
  const handleCompleteClassroom = async () => {
    if (!confirm('Are you sure you want to mark this classroom as completed? This action cannot be undone and will prevent any new feedback from being added.')) {
      return
    }

    try {
      await completeClassroom(uuid!)
      refreshClassroom()
    } catch (err) {
      setClassroomError('Failed to complete classroom')
    }
  }

  if (loading) {
    return <Loading />
  }

  if (!classroom) {
    return (
      <div className="container">
        <p style={{ color: 'red' }}>{error || 'Classroom not found'}</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="row">
        <div className="twelve columns">
          <ClassroomHeader classroom={classroom} />

          {classroom.role === 'teacher' ? (
            <TeacherView
              classroom={classroom}
              checkpoints={checkpoints}
              studentProgress={studentProgress}
              selectedStudent={selectedStudent}
              inviteCode={inviteCode}
              showInviteCode={showInviteCode}
              newFeedback={newFeedback}
              editingFeedbackUuid={editingFeedbackUuid}
              editFeedbackContent={editFeedbackContent}
              uploadingImagesFeedbackUuid={uploadingImagesFeedbackUuid}
              error={error}
              onFetchInviteCode={fetchInviteCode}
              onSelectStudent={handleSelectStudent}
              onRemoveStudent={handleRemoveStudent}
              onAddCheckpoint={addCheckpoint}
              onDeleteCheckpoint={handleDeleteCheckpoint}
              onToggleCheckpoint={handleToggleCheckpoint}
              onNewFeedbackChange={setNewFeedback}
              onAddFeedback={handleAddFeedback}
              onStartEditFeedback={startEditFeedback}
              onCancelEditFeedback={cancelEditFeedback}
              onSaveEditFeedback={handleSaveEditFeedback}
              onEditContentChange={setEditFeedbackContent}
              onToggleLockFeedback={handleToggleLockFeedback}
              onImageUpload={handleImageUpload}
              onDeleteImage={handleDeleteImage}
              onStartImageUpload={setUploadingImagesFeedbackUuid}
              onCancelImageUpload={() => setUploadingImagesFeedbackUuid(null)}
              canEditFeedback={(fb) => canEditFeedback(fb, user, classroom)}
              canAddImages={(fb) => canAddImagesToFeedback(fb, user, classroom)}
              timelineItems={timelineItems}
              onCompleteClassroom={handleCompleteClassroom}
            />
          ) : (
            <StudentView
              studentProgress={studentProgress}
              nextCheckpoint={nextCheckpoint}
              newFeedback={newFeedback}
              editingFeedbackUuid={editingFeedbackUuid}
              editFeedbackContent={editFeedbackContent}
              uploadingImagesFeedbackUuid={uploadingImagesFeedbackUuid}
              error={error}
              isCompleted={classroom.completed === true}
              isActive={classroom.active !== false}
              onNewFeedbackChange={setNewFeedback}
              onAddFeedback={handleAddFeedback}
              onStartEditFeedback={startEditFeedback}
              onCancelEditFeedback={cancelEditFeedback}
              onSaveEditFeedback={handleSaveEditFeedback}
              onEditContentChange={setEditFeedbackContent}
              onImageUpload={handleImageUpload}
              onDeleteImage={handleDeleteImage}
              onStartImageUpload={setUploadingImagesFeedbackUuid}
              onCancelImageUpload={() => setUploadingImagesFeedbackUuid(null)}
              canEditFeedback={(fb) => canEditFeedback(fb, user, classroom)}
              canAddImages={(fb) => canAddImagesToFeedback(fb, user, classroom)}
              timelineItems={timelineItems}
              onLeaveClassroom={handleLeaveClassroom}
              onRejoinClassroom={handleRejoinClassroom}
            />
          )}
        </div>
      </div>
    </div>
  )
}
