import { useState, FormEvent } from 'react'
import { Button, Alert, Timeline } from '../common'
import { CheckpointTable, CheckpointForm, CheckpointProgress } from '../checkpoint'
import { FeedbackForm, FeedbackItem } from '../feedback'
import { StudentList, InviteCodeDisplay } from '../classroom'
import { formatDate, getImageUrl, stripHtmlTags } from '../../utils'
import type { Classroom, Student, Feedback, Checkpoint } from '../../types'

interface TeacherViewProps {
  classroom: Classroom
  checkpoints: Checkpoint[]
  studentProgress: Checkpoint[]
  feedback: Feedback[]
  selectedStudent: Student | null
  inviteCode: string
  showInviteCode: boolean
  newFeedback: string
  editingFeedbackUuid: string | null
  editFeedbackContent: string
  uploadingImagesFeedbackUuid: string | null
  error: string
  onFetchInviteCode: () => void
  onSelectStudent: (student: Student) => void
  onRemoveStudent: (student: Student) => void
  onAddCheckpoint: (name: string, description: string) => Promise<void>
  onDeleteCheckpoint: (uuid: string) => void
  onToggleCheckpoint: (uuid: string, reached: boolean) => void
  onNewFeedbackChange: (value: string) => void
  onAddFeedback: () => Promise<void>
  onStartEditFeedback: (fb: Feedback) => void
  onCancelEditFeedback: () => void
  onSaveEditFeedback: () => Promise<void>
  onEditContentChange: (content: string) => void
  onToggleLockFeedback: (uuid: string, locked: boolean) => void
  onImageUpload: (feedbackUuid: string, files: FileList | null) => void
  onDeleteImage: (uuid: string) => void
  onStartImageUpload: (feedbackUuid: string) => void
  onCancelImageUpload: () => void
  canEditFeedback: (fb: Feedback) => boolean
  canAddImages: (fb: Feedback) => boolean
  timelineItems: Array<{ type: 'feedback' | 'checkpoint'; date: string; data: Feedback | Checkpoint }>
  onCompleteClassroom: () => void
}

export default function TeacherView({
  classroom,
  checkpoints,
  studentProgress,
  feedback,
  selectedStudent,
  inviteCode,
  showInviteCode,
  newFeedback,
  editingFeedbackUuid,
  editFeedbackContent,
  uploadingImagesFeedbackUuid,
  error,
  onFetchInviteCode,
  onSelectStudent,
  onRemoveStudent,
  onAddCheckpoint,
  onDeleteCheckpoint,
  onToggleCheckpoint,
  onNewFeedbackChange,
  onAddFeedback,
  onStartEditFeedback,
  onCancelEditFeedback,
  onSaveEditFeedback,
  onEditContentChange,
  onToggleLockFeedback,
  onImageUpload,
  onDeleteImage,
  onStartImageUpload,
  onCancelImageUpload,
  canEditFeedback,
  canAddImages,
  timelineItems,
  onCompleteClassroom
}: TeacherViewProps) {
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false)
  const [newCheckpointName, setNewCheckpointName] = useState('')
  const [newCheckpointDescription, setNewCheckpointDescription] = useState('')
  const isCompleted = classroom.completed === true

  const handleAddCheckpoint = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCheckpointName.trim()) return
    await onAddCheckpoint(newCheckpointName, newCheckpointDescription)
    setNewCheckpointName('')
    setNewCheckpointDescription('')
    setShowAddCheckpoint(false)
  }

  const handleAddFeedback = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripHtmlTags(newFeedback)) return
    await onAddFeedback()
  }

  const handleDeleteCheckpoint = (uuid: string) => {
    if (confirm('Are you sure you want to delete this checkpoint? This will also remove all student progress for this checkpoint.')) {
      onDeleteCheckpoint(uuid)
    }
  }

  return (
    <>
      {error && <Alert type="error">{error}</Alert>}

      {isCompleted && (
        <Alert type="warning">
          This classroom has been marked as completed. No new feedback can be added.
        </Alert>
      )}

      <div style={{ marginBottom: '20px' }}>
        <Button onClick={onFetchInviteCode} style={{ marginRight: '10px' }}>
          {showInviteCode ? 'Refresh Invite Code' : 'Get Invite Link'}
        </Button>
        {!isCompleted && (
          <>
            <Button onClick={() => setShowAddCheckpoint(!showAddCheckpoint)} style={{ marginRight: '10px' }}>
              {showAddCheckpoint ? 'Cancel' : 'Add Checkpoint'}
            </Button>
            <Button variant="warning" onClick={onCompleteClassroom}>
              Mark as Completed
            </Button>
          </>
        )}
        {showInviteCode && <InviteCodeDisplay code={inviteCode} />}
      </div>

      {showAddCheckpoint && (
        <CheckpointForm
          name={newCheckpointName}
          description={newCheckpointDescription}
          onNameChange={setNewCheckpointName}
          onDescriptionChange={setNewCheckpointDescription}
          onSubmit={handleAddCheckpoint}
          onCancel={() => setShowAddCheckpoint(false)}
        />
      )}

      <CheckpointTable checkpoints={checkpoints} onDelete={handleDeleteCheckpoint} />

      <div className="row">
        <div className="four columns">
          <h4>Students</h4>
          <StudentList
            students={classroom.students || []}
            selectedStudentUuid={selectedStudent?.uuid}
            onSelectStudent={onSelectStudent}
            onRemoveStudent={onRemoveStudent}
          />
        </div>
        <div className="eight columns">
          {selectedStudent ? (
            <>
              <h4>{selectedStudent.first_name} {selectedStudent.last_name}</h4>

              <CheckpointProgress
                checkpoints={studentProgress}
                onToggle={onToggleCheckpoint}
                editable={!isCompleted}
              />

              {!isCompleted && (
                <FeedbackForm
                  value={newFeedback}
                  onChange={onNewFeedbackChange}
                  onSubmit={handleAddFeedback}
                  label="Add Feedback"
                  placeholder="Write your feedback here..."
                />
              )}

              <h5>Timeline</h5>
              <Timeline
                items={timelineItems}
                emptyMessage="No feedback or checkpoints yet for this student."
                renderCheckpointItem={(cp) => (
                  <>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#4CAF50' }}>
                      Checkpoint Reached: {cp.name}
                    </p>
                    <small style={{ color: '#666' }}>
                      {formatDate(cp.reached_at || '')}
                    </small>
                  </>
                )}
                renderFeedbackItem={(fb) => (
                  <FeedbackItem
                    feedback={fb}
                    isEditing={editingFeedbackUuid === fb.uuid}
                    editContent={editFeedbackContent}
                    canEdit={canEditFeedback(fb)}
                    canLock={true}
                    canUploadImages={canAddImages(fb)}
                    isUploadingImages={uploadingImagesFeedbackUuid === fb.uuid}
                    onEditStart={() => onStartEditFeedback(fb)}
                    onEditCancel={onCancelEditFeedback}
                    onEditSave={onSaveEditFeedback}
                    onEditContentChange={onEditContentChange}
                    onLockToggle={() => onToggleLockFeedback(fb.uuid, fb.locked)}
                    onImageDelete={onDeleteImage}
                    onImageUpload={(files) => onImageUpload(fb.uuid, files)}
                    onStartImageUpload={() => onStartImageUpload(fb.uuid)}
                    onCancelImageUpload={onCancelImageUpload}
                    getImageUrl={getImageUrl}
                    formatDate={formatDate}
                  />
                )}
              />
            </>
          ) : (
            <p>Select a student to view and add feedback.</p>
          )}
        </div>
      </div>
    </>
  )
}
