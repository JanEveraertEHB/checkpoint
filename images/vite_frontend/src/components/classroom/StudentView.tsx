import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Alert, Timeline, Button, Tabs } from '../common'
import { NextCheckpointCard, CheckpointBadges } from '../checkpoint'
import { FeedbackForm, FeedbackItem } from '../feedback'
import { formatDate, getImageUrl, getDocumentUrl, stripHtmlTags } from '../../utils'
import { colors, spacing, borderRadius, typography } from '../../styles/theme'
import type { Feedback, Checkpoint } from '../../types'
import { getFeedbackDemands, fulfillFeedbackDemand, deleteFeedbackDemand } from '../../services/api'

interface FeedbackDemand {
  id: number
  uuid: string
  classroom_uuid: string
  student_uuid: string
  teacher_uuid: string
  message: string | null
  fulfilled: boolean
  created_at: string
  fulfilled_at: string | null
  teacher_first_name: string
  teacher_last_name: string
  classroom_name: string
}

interface StudentViewProps {
  studentProgress: Checkpoint[]
  nextCheckpoint: Checkpoint | null
  newFeedback: string
  editingFeedbackUuid: string | null
  editFeedbackContent: string
  uploadingImagesFeedbackUuid: string | null
  uploadingDocumentsFeedbackUuid: string | null
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
  onDocumentUpload: (feedbackUuid: string, files: FileList | null) => void
  onDeleteDocument: (uuid: string) => void
  onStartDocumentUpload: (feedbackUuid: string) => void
  onCancelDocumentUpload: () => void
  canEditFeedback: (fb: Feedback) => boolean
  canAddImages: (fb: Feedback) => boolean
  canAddDocuments: (fb: Feedback) => boolean
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
  uploadingDocumentsFeedbackUuid,
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
  onDocumentUpload,
  onDeleteDocument,
  onStartDocumentUpload,
  onCancelDocumentUpload,
  canEditFeedback,
  canAddImages,
  canAddDocuments,
  timelineItems,
  onLeaveClassroom,
  onRejoinClassroom
}: StudentViewProps) {
  const [activeTab, setActiveTab] = useState('feedback')
  const [demands, setDemands] = useState<FeedbackDemand[]>([])
  const [demandsError, setDemandsError] = useState('')

  useEffect(() => {
    fetchDemands()
  }, [])

  const fetchDemands = async () => {
    try {
      const response = await getFeedbackDemands()
      setDemands(response.data)
    } catch (err) {
      setDemandsError('Failed to load feedback demands')
    }
  }

  const handleFulfillDemand = async (demandUuid: string) => {
    try {
      await fulfillFeedbackDemand(demandUuid)
      fetchDemands()
    } catch (err) {
      setDemandsError('Failed to mark demand as done')
    }
  }

  const handleDeleteDemand = async (demandUuid: string) => {
    if (!confirm('Are you sure you want to delete this demand?')) return
    try {
      await deleteFeedbackDemand(demandUuid)
      fetchDemands()
    } catch (err) {
      setDemandsError('Failed to delete demand')
    }
  }

  const handleAddFeedback = async (e: FormEvent) => {
    e.preventDefault()
    if (!stripHtmlTags(newFeedback)) return
    await onAddFeedback()
  }

  const unfulfilledDemands = demands.filter(d => !d.fulfilled)

  const feedbackTab = (
    <>
      {nextCheckpoint && <NextCheckpointCard checkpoint={nextCheckpoint} />}

      <CheckpointBadges checkpoints={studentProgress} />

      {unfulfilledDemands.length > 0 && (
        <div style={{
          backgroundColor: colors.demandBg,
          border: `1px solid ${colors.demandBorder}`,
          borderRadius: borderRadius.md,
          padding: spacing.md,
          marginBottom: spacing.lg
        }}>
          <h5 style={{ marginTop: 0, color: colors.demandText }}>
            Feedback Demands ({unfulfilledDemands.length})
          </h5>
          {demandsError && (
            <p style={{ color: colors.danger, fontSize: typography.fontSizeBase }}>
              {demandsError}
            </p>
          )}
          {unfulfilledDemands.map(demand => (
            <div
              key={demand.uuid}
              style={{
                backgroundColor: colors.white,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: borderRadius.md,
                padding: spacing.sm,
                marginBottom: spacing.sm
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: 'bold',
                    fontSize: typography.fontSizeBase
                  }}>
                    {demand.teacher_first_name} {demand.teacher_last_name} requested feedback
                  </p>
                  {demand.message && (
                    <p style={{
                      margin: `${spacing.xs} 0`,
                      fontSize: typography.fontSizeBase,
                      color: colors.textSecondary
                    }}>
                      {demand.message}
                    </p>
                  )}
                  <small style={{ color: colors.textMuted, fontSize: typography.fontSizeSm }}>
                    {formatDate(demand.created_at)}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: spacing.xs }}>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handleFulfillDemand(demand.uuid)}
                  >
                    Mark Done
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDeleteDemand(demand.uuid)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            canUploadDocuments={canAddDocuments(fb)}
            isUploadingDocuments={uploadingDocumentsFeedbackUuid === fb.uuid}
            onEditStart={() => onStartEditFeedback(fb)}
            onEditCancel={onCancelEditFeedback}
            onEditSave={onSaveEditFeedback}
            onEditContentChange={onEditContentChange}
            onLockToggle={() => {}}
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
  )

  const settingsTab = (
    <>
      <h4>Classroom Settings</h4>

      <div style={{ marginBottom: spacing.lg }}>
        <h5>Membership</h5>
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
        <p style={{
          fontSize: typography.fontSizeBase,
          color: colors.textSecondary,
          marginTop: spacing.sm
        }}>
          {isActive
            ? 'Leaving the classroom will keep your feedback history but mark you as inactive.'
            : 'You have left this classroom. You can still view your feedback history.'}
        </p>
      </div>
    </>
  )

  const notesTab = (
    <>
      <h4>Notes</h4>
      <p style={{ color: '#666' }}>Notes feature coming soon...</p>
    </>
  )

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
          You have left this classroom. You can still view your feedback history.
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
    </div>
  )
}
