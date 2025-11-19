import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useClassroom, useCheckpoints, useFeedback, useTimeline } from '../hooks'
import { Loading } from '../components/common'
import { ClassroomHeader, StudentView } from '../components/classroom'
import { leaveClassroom, rejoinClassroom, createFeedbackRequest } from '../services/api'

export default function ClassroomDetail() {
  const { uuid } = useParams<{ uuid: string }>()
  const { user } = useAuth()
  const [newFeedback, setNewFeedback] = useState('')

  // Custom hooks for data management
  const {
    classroom,
    loading,
    error: classroomError,
    setError: setClassroomError,
    refreshClassroom
  } = useClassroom(uuid)

  const {
    studentProgress,
    nextCheckpoint,
    error: checkpointError,
    fetchStudentProgress
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
    fetchMyFeedback,
    addFeedback,
    saveFeedbackEdit,
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
    if (classroom && uuid && user) {
      fetchMyFeedback()
      fetchStudentProgress(user.uuid)
    }
  }, [classroom, user, uuid])

  // Handle adding feedback
  const handleAddFeedback = async () => {
    if (!user?.uuid) return

    await addFeedback(user.uuid, newFeedback)
    setNewFeedback('')
    fetchMyFeedback()
  }

  // Handle saving feedback edit
  const handleSaveEditFeedback = async () => {
    await saveFeedbackEdit()
    fetchMyFeedback()
  }

  // Handle image upload
  const handleImageUpload = async (feedbackUuid: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    await uploadImages(feedbackUuid, files)
    fetchMyFeedback()
  }

  // Handle image deletion
  const handleDeleteImage = async (imageUuid: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    await deleteImage(imageUuid)
    fetchMyFeedback()
  }

  // Handle document upload
  const handleDocumentUpload = async (feedbackUuid: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    await uploadDocuments(feedbackUuid, files)
    fetchMyFeedback()
  }

  // Handle document deletion
  const handleDeleteDocument = async (documentUuid: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    await deleteDocument(documentUuid)
    fetchMyFeedback()
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

  // Handle requesting feedback (student only)
  const handleRequestFeedback = async () => {
    try {
      await createFeedbackRequest(uuid!)
      alert('Feedback request sent to your teacher!')
    } catch (err) {
      setClassroomError('Failed to send feedback request')
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
    <div className="fullscreenContainer">
      <ClassroomHeader
        classroom={classroom}
        onRequestFeedback={handleRequestFeedback}
      />
      <StudentView
        classroomUuid={uuid!}
        studentProgress={studentProgress}
        nextCheckpoint={nextCheckpoint}
        newFeedback={newFeedback}
        editingFeedbackUuid={editingFeedbackUuid}
        editFeedbackContent={editFeedbackContent}
        uploadingImagesFeedbackUuid={uploadingImagesFeedbackUuid}
        uploadingDocumentsFeedbackUuid={uploadingDocumentsFeedbackUuid}
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
        onDocumentUpload={handleDocumentUpload}
        onDeleteDocument={handleDeleteDocument}
        onStartDocumentUpload={setUploadingDocumentsFeedbackUuid}
        onCancelDocumentUpload={() => setUploadingDocumentsFeedbackUuid(null)}
        canEditFeedback={(fb) => canEditFeedback(fb, user, classroom)}
        canAddImages={(fb) => canAddImagesToFeedback(fb, user, classroom)}
        canAddDocuments={(fb) => canAddDocumentsToFeedback(fb, user, classroom)}
        timelineItems={timelineItems}
        onLeaveClassroom={handleLeaveClassroom}
        onRejoinClassroom={handleRejoinClassroom}
      />
    </div>
  )
}
