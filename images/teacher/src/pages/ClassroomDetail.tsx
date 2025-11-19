import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useClassroom, useCheckpoints, useFeedback, useTimeline } from '../hooks'
import { Loading } from '../components/common'
import { ClassroomHeader, TeacherView, StudentList } from '../components/classroom'
import { removeStudentFromClassroom, completeClassroom, createFeedbackDemand, createClassroomWideFeedbackDemand, updateClassroom, removePendingMember } from '../services/api'
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
    hasProgress,
    error: checkpointError,
    fetchCheckpoints,
    fetchHasProgress,
    fetchStudentProgress,
    addCheckpoint,
    removeCheckpoint,
    editCheckpoint,
    reorderCheckpoint,
    toggleCheckpointReached
  } = useCheckpoints(uuid)

  const {
    feedback,
    editingFeedbackUuid,
    editFeedbackContent,
    uploadingImagesFeedbackUuid,
    uploadingDocumentsFeedbackUuid,
    error: feedbackError,
    setEditFeedbackContent,
    setUploadingImagesFeedbackUuid,
    setUploadingDocumentsFeedbackUuid,
    fetchStudentFeedback,
    addFeedback,
    saveFeedbackEdit,
    toggleFeedbackLock,
    uploadImages,
    deleteImage,
    uploadDocuments,
    deleteDocument,
    startEditFeedback,
    cancelEditFeedback,
    canEditFeedback,
    canAddImagesToFeedback,
    canAddDocumentsToFeedback
  } = useFeedback(uuid)

  const timelineItems = useTimeline(feedback, studentProgress)

  // Combine errors
  const error = classroomError || checkpointError || feedbackError

  // Fetch data when classroom loads
  useEffect(() => {
    if (classroom && uuid) {
      fetchCheckpoints()
      fetchHasProgress()
    }
  }, [classroom, uuid])

  // Handle student selection (teacher view)
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    fetchStudentFeedback(student.uuid)
    fetchStudentProgress(student.uuid)
  }

  // Handle adding feedback
  const handleAddFeedback = async () => {
    if (!selectedStudent) return

    await addFeedback(selectedStudent.uuid, newFeedback)
    setNewFeedback('')
    fetchStudentFeedback(selectedStudent.uuid)
  }

  // Handle saving feedback edit
  const handleSaveEditFeedback = async () => {
    await saveFeedbackEdit()
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
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

  // Handle editing checkpoint
  const handleEditCheckpoint = async (checkpointUuid: string, name: string, description: string) => {
    await editCheckpoint(checkpointUuid, name, description)
    if (selectedStudent) {
      fetchStudentProgress(selectedStudent.uuid)
    }
  }

  // Handle reordering checkpoint
  const handleReorderCheckpoint = async (checkpointUuid: string, newOrderIndex: number) => {
    await reorderCheckpoint(checkpointUuid, newOrderIndex)
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
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    }
  }

  // Handle image deletion
  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    await deleteImage(imageUuid)
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (feedbackUuid: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    await uploadDocuments(feedbackUuid, files)
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
    }
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentUuid: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    await deleteDocument(documentUuid)
    if (selectedStudent) {
      fetchStudentFeedback(selectedStudent.uuid)
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

  // Handle removing pending member (teacher only)
  const handleRemovePending = async (email: string) => {
    if (!confirm(`Are you sure you want to remove the pending invitation for ${email}?`)) {
      return
    }

    try {
      await removePendingMember(uuid!, email)
      refreshClassroom()
    } catch (err) {
      setClassroomError('Failed to remove pending invitation')
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

  // Handle demanding feedback (teacher only)
  const handleDemandFeedback = async (studentUuid: string) => {
    try {
      await createFeedbackDemand(uuid!, studentUuid)
      alert('Feedback demand sent to the student!')
    } catch (err) {
      setClassroomError('Failed to send feedback demand')
    }
  }

  // Handle demanding feedback from all students (teacher only)
  const handleDemandFeedbackFromAll = async () => {
    if (!confirm('Are you sure you want to send a feedback demand to all active students in this classroom?')) {
      return
    }

    try {
      const response = await createClassroomWideFeedbackDemand(uuid!)
      alert(response.data.message)
    } catch (err) {
      setClassroomError('Failed to send feedback demands')
    }
  }

  // Handle updating classroom settings (teacher only)
  const handleUpdateClassroom = async (updates: { name?: string; academic_year?: string; allowed_email_domain?: string | null }) => {
    await updateClassroom(uuid!, updates)
    await refreshClassroom()
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
    <div className="fullWidthContainer">
      <div className="leftContainer">
        <div className="container">
          <div className="row">
            <div className="twelve columns">
              <ClassroomHeader
                classroom={classroom}
                onDemandFeedbackFromAll={handleDemandFeedbackFromAll}
              />
            </div>
          </div>
          <div className="row">
            <div className="twelve columns">
              <StudentList
                students={classroom.students || []}
                pendingStudents={classroom.pendingStudents || []}
                selectedStudentUuid={selectedStudent?.uuid}
                onSelectStudent={handleSelectStudent}
                onRemoveStudent={handleRemoveStudent}
                onRemovePending={handleRemovePending}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rightContainer">
        <div className="container">
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
            uploadingDocumentsFeedbackUuid={uploadingDocumentsFeedbackUuid}
            error={error}
            canReorderCheckpoints={!hasProgress}
            onFetchInviteCode={fetchInviteCode}
            onAddCheckpoint={addCheckpoint}
            onDeleteCheckpoint={handleDeleteCheckpoint}
            onEditCheckpoint={handleEditCheckpoint}
            onReorderCheckpoint={handleReorderCheckpoint}
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
            onDocumentUpload={handleDocumentUpload}
            onDeleteDocument={handleDeleteDocument}
            onStartDocumentUpload={setUploadingDocumentsFeedbackUuid}
            onCancelDocumentUpload={() => setUploadingDocumentsFeedbackUuid(null)}
            canEditFeedback={(fb) => canEditFeedback(fb, user, classroom)}
            canAddImages={(fb) => canAddImagesToFeedback(fb, user, classroom)}
            canAddDocuments={(fb) => canAddDocumentsToFeedback(fb, user, classroom)}
            timelineItems={timelineItems}
            onCompleteClassroom={handleCompleteClassroom}
            onDemandFeedback={handleDemandFeedback}
            onUpdateClassroom={handleUpdateClassroom}
            onRefreshClassroom={refreshClassroom}
            onRemovePending={handleRemovePending}
          />
      </div>
    </div>
  </div>
  )
}
