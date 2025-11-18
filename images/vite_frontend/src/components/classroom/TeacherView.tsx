import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Alert, Timeline, Tabs } from '../common'
import { CheckpointTable, CheckpointForm, CheckpointProgress } from '../checkpoint'
import { FeedbackForm, FeedbackItem } from '../feedback'
import { InviteCodeDisplay } from '../classroom'
import { formatDate, getImageUrl, getDocumentUrl, stripHtmlTags } from '../../utils'
import { colors, spacing, typography } from '../../styles/theme'
import type { Classroom, Student, Feedback, Checkpoint } from '../../types'

interface TeacherViewProps {
  classroom: Classroom
  checkpoints: Checkpoint[]
  studentProgress: Checkpoint[]
  selectedStudent: Student | null
  inviteCode: string
  showInviteCode: boolean
  newFeedback: string
  editingFeedbackUuid: string | null
  editFeedbackContent: string
  uploadingImagesFeedbackUuid: string | null
  uploadingDocumentsFeedbackUuid: string | null
  error: string
  canReorderCheckpoints: boolean
  onFetchInviteCode: () => void
  onAddCheckpoint: (name: string, description: string) => Promise<void>
  onDeleteCheckpoint: (uuid: string) => void
  onEditCheckpoint: (uuid: string, name: string, description: string) => Promise<void>
  onReorderCheckpoint: (uuid: string, newOrderIndex: number) => Promise<void>
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
  onDocumentUpload: (feedbackUuid: string, files: FileList | null) => void
  onDeleteDocument: (uuid: string) => void
  onStartDocumentUpload: (feedbackUuid: string) => void
  onCancelDocumentUpload: () => void
  canEditFeedback: (fb: Feedback) => boolean
  canAddImages: (fb: Feedback) => boolean
  canAddDocuments: (fb: Feedback) => boolean
  timelineItems: Array<{ type: 'feedback' | 'checkpoint'; date: string; data: Feedback | Checkpoint }>
  onCompleteClassroom: () => void
  onDemandFeedback: (studentUuid: string) => void
}

export default function TeacherView({
  classroom,
  checkpoints,
  studentProgress,
  selectedStudent,
  inviteCode,
  showInviteCode,
  newFeedback,
  editingFeedbackUuid,
  editFeedbackContent,
  uploadingImagesFeedbackUuid,
  uploadingDocumentsFeedbackUuid,
  error,
  canReorderCheckpoints,
  onFetchInviteCode,
  onAddCheckpoint,
  onDeleteCheckpoint,
  onEditCheckpoint,
  onReorderCheckpoint,
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
  onDocumentUpload,
  onDeleteDocument,
  onStartDocumentUpload,
  onCancelDocumentUpload,
  canEditFeedback,
  canAddImages,
  canAddDocuments,
  timelineItems,
  onCompleteClassroom,
  onDemandFeedback
}: TeacherViewProps) {
  const [activeTab, setActiveTab] = useState('feedback')
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

  const feedbackTab = (
    <div className="row">
      <div className="twelve columns">
        {selectedStudent ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h4 style={{ margin: 0 }}>{selectedStudent.first_name} {selectedStudent.last_name}</h4>
              {!isCompleted && selectedStudent.active !== false && (
                <Button
                  variant="primary"
                  onClick={() => onDemandFeedback(selectedStudent.uuid)}
                >
                  Ask for an update
                </Button>
              )}
            </div>

            <CheckpointProgress
              checkpoints={studentProgress}
              onToggle={onToggleCheckpoint}
              editable={!isCompleted}
            />

            {!isCompleted && selectedStudent.active !== false && (
              <FeedbackForm
                value={newFeedback}
                onChange={onNewFeedbackChange}
                onSubmit={handleAddFeedback}
                label="Add Feedback"
                placeholder="Write your feedback here..."
              />
            )}

            {selectedStudent.active === false && (
              <Alert type="warning">
                This student has left the classroom. No new feedback can be added.
              </Alert>
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
                  canUploadDocuments={canAddDocuments(fb)}
                  isUploadingDocuments={uploadingDocumentsFeedbackUuid === fb.uuid}
                  onEditStart={() => onStartEditFeedback(fb)}
                  onEditCancel={onCancelEditFeedback}
                  onEditSave={onSaveEditFeedback}
                  onEditContentChange={onEditContentChange}
                  onLockToggle={() => onToggleLockFeedback(fb.uuid, fb.locked)}
                  onImageDelete={onDeleteImage}
                  onImageUpload={(files) => onImageUpload(fb.uuid, files)}
                  onStartImageUpload={() => onStartImageUpload(fb.uuid)}
                  onCancelImageUpload={onCancelImageUpload}
                  onDocumentDelete={onDeleteDocument}
                  onDocumentUpload={(files) => onDocumentUpload(fb.uuid, files)}
                  onStartDocumentUpload={() => onStartDocumentUpload(fb.uuid)}
                  onCancelDocumentUpload={onCancelDocumentUpload}
                  getImageUrl={getImageUrl}
                  getDocumentUrl={getDocumentUrl}
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
  )

  const settingsTab = (
    <>
      <h4>Classroom Settings</h4>

      <div style={{ marginBottom: spacing.lg }}>
        <h5>Invite Students</h5>
        <Button onClick={onFetchInviteCode}>
          {showInviteCode ? 'Refresh Invite Code' : 'Get Invite Link'}
        </Button>
        {showInviteCode && <InviteCodeDisplay code={inviteCode} />}
      </div>

      <div style={{ marginBottom: spacing.lg }}>
        <h5>Checkpoints</h5>
        {!isCompleted && (
          <Button
            onClick={() => setShowAddCheckpoint(!showAddCheckpoint)}
            style={{ marginBottom: spacing.sm }}
          >
            {showAddCheckpoint ? 'Cancel' : 'Add Checkpoint'}
          </Button>
        )}

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

        <CheckpointTable
          checkpoints={checkpoints}
          onDelete={handleDeleteCheckpoint}
          onEdit={onEditCheckpoint}
          onReorder={onReorderCheckpoint}
          canReorder={canReorderCheckpoints}
        />
      </div>

      {!isCompleted && (
        <div>
          <h5>Classroom Status</h5>
          <Button variant="warning" onClick={onCompleteClassroom}>
            Mark Classroom as Completed
          </Button>
          <p style={{
            fontSize: typography.fontSizeBase,
            color: colors.textSecondary,
            marginTop: spacing.sm
          }}>
            Marking as completed will prevent any new feedback from being added.
          </p>
        </div>
      )}
    </>
  )

  const notesTab = (
    <>
      <h4>Notes</h4>
      <p style={{ color: '#666' }}>Notes feature coming soon...</p>
    </>
  )

  return (
    <>
      {error && <Alert type="error">{error}</Alert>}

      {isCompleted && (
        <Alert type="warning">
          This classroom has been marked as completed. No new feedback can be added.
        </Alert>
      )}

      <Tabs
        tabs={[
          { id: 'feedback', label: 'Feedback', content: feedbackTab },
          { id: 'notes', label: 'Notes', content: notesTab },
          { id: 'settings', label: 'Settings', content: settingsTab },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </>
  )
}
