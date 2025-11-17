import type { FormEvent } from 'react'
import { Alert, Timeline, Button } from '../common'
import { NextCheckpointCard, CheckpointBadges } from '../checkpoint'
import { FeedbackForm, FeedbackItem } from '../feedback'
import { formatDate, getImageUrl, stripHtmlTags } from '../../utils'
import type { Feedback, Checkpoint } from '../../types'

interface StudentViewProps {
  studentProgress: Checkpoint[]
  nextCheckpoint: Checkpoint | null
  newFeedback: string
  editingFeedbackUuid: string | null
  editFeedbackContent: string
  uploadingImagesFeedbackUuid: string | null
  error: string
  isCompleted: boolean
  isActive: boolean
  onNewFeedbackChange: (value: string) => void
  onAddFeedback: () => Promise<void>
  onStartEditFeedback: (fb: Feedback) => void
  onCancelEditFeedback: () => void
  onSaveEditFeedback: () => Promise<void>
  onEditContentChange: (content: string) => void
  onImageUpload: (feedbackUuid: string, files: FileList | null) => void
  onDeleteImage: (uuid: string) => void
  onStartImageUpload: (feedbackUuid: string) => void
  onCancelImageUpload: () => void
  canEditFeedback: (fb: Feedback) => boolean
  canAddImages: (fb: Feedback) => boolean
  timelineItems: Array<{ type: 'feedback' | 'checkpoint'; date: string; data: Feedback | Checkpoint }>
  onLeaveClassroom: () => void
  onRejoinClassroom: () => void
}

export default function StudentView({
  studentProgress,
  nextCheckpoint,
  newFeedback,
  editingFeedbackUuid,
  editFeedbackContent,
  uploadingImagesFeedbackUuid,
  error,
  isCompleted,
  isActive,
  onNewFeedbackChange,
  onAddFeedback,
  onStartEditFeedback,
  onCancelEditFeedback,
  onSaveEditFeedback,
  onEditContentChange,
  onImageUpload,
  onDeleteImage,
  onStartImageUpload,
  onCancelImageUpload,
  canEditFeedback,
  canAddImages,
  timelineItems,
  onLeaveClassroom,
  onRejoinClassroom
}: StudentViewProps) {
  const handleAddFeedback = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripHtmlTags(newFeedback)) return
    await onAddFeedback()
  }

  return (
    <div>
      {error && <Alert type="error">{error}</Alert>}

      {isCompleted && (
        <Alert type="warning">
          This classroom has been marked as completed. No new feedback can be added.
        </Alert>
      )}

      {!isActive && !isCompleted && (
        <Alert type="warning">
          You have left this classroom. You can still view your feedback history. Click "Rejoin Classroom" to become an active member again.
        </Alert>
      )}

      <div style={{ marginBottom: '20px' }}>
        {!isCompleted && isActive && (
          <Button variant="danger" size="small" onClick={onLeaveClassroom}>
            Leave Classroom
          </Button>
        )}
        {!isCompleted && !isActive && (
          <Button variant="primary" size="small" onClick={onRejoinClassroom}>
            Rejoin Classroom
          </Button>
        )}
      </div>

      {nextCheckpoint && <NextCheckpointCard checkpoint={nextCheckpoint} />}

      <CheckpointBadges checkpoints={studentProgress} />

      <h4>My Timeline</h4>
      {!isCompleted && isActive && (
        <FeedbackForm
          value={newFeedback}
          onChange={onNewFeedbackChange}
          onSubmit={handleAddFeedback}
          label="Add Your Own Feedback"
          placeholder="Record feedback you received..."
        />
      )}

      <Timeline
        items={timelineItems}
        emptyMessage="No feedback or checkpoints yet. Add your own feedback or wait for your teacher."
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
            canLock={false}
            canUploadImages={canAddImages(fb)}
            isUploadingImages={uploadingImagesFeedbackUuid === fb.uuid}
            onEditStart={() => onStartEditFeedback(fb)}
            onEditCancel={onCancelEditFeedback}
            onEditSave={onSaveEditFeedback}
            onEditContentChange={onEditContentChange}
            onLockToggle={() => {}}
            onImageDelete={onDeleteImage}
            onImageUpload={(files) => onImageUpload(fb.uuid, files)}
            onStartImageUpload={() => onStartImageUpload(fb.uuid)}
            onCancelImageUpload={onCancelImageUpload}
            getImageUrl={getImageUrl}
            formatDate={formatDate}
          />
        )}
      />
    </div>
  )
}
