import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Button, Alert, Timeline, Tabs } from '../common'
import { CheckpointTable, CheckpointForm, CheckpointProgress } from '../checkpoint'
import { FeedbackForm, FeedbackItem } from '../feedback'
import { InviteCodeDisplay } from '../classroom'
import { Notes } from '../notes'
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
  onUpdateClassroom: (updates: { name?: string; academic_year?: string; allowed_email_domain?: string | null }) => Promise<void>
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
  onDemandFeedback,
  onUpdateClassroom
}: TeacherViewProps) {
  const [activeTab, setActiveTab] = useState('feedback')
  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false)
  const [newCheckpointName, setNewCheckpointName] = useState('')
  const [newCheckpointDescription, setNewCheckpointDescription] = useState('')
  const [classroomName, setClassroomName] = useState(classroom.name)
  const [academicYear, setAcademicYear] = useState(classroom.academic_year)
  const [allowedEmailDomain, setAllowedEmailDomain] = useState(classroom.allowed_email_domain || '')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsSuccess, setSettingsSuccess] = useState(false)
  const isCompleted = classroom.completed === true

  // Update form fields when classroom data changes
  useEffect(() => {
    setClassroomName(classroom.name)
    setAcademicYear(classroom.academic_year)
    setAllowedEmailDomain(classroom.allowed_email_domain || '')
  }, [classroom.name, classroom.academic_year, classroom.allowed_email_domain])

  const handleAddCheckpoint = async (e: FormEvent) => {
    e.preventDefault()
    if (!newCheckpointName.trim()) return
    await onAddCheckpoint(newCheckpointName, newCheckpointDescription)
    setNewCheckpointName('')
    setNewCheckpointDescription('')
    setShowAddCheckpoint(false)
  }

  const handleSaveClassroomSettings = async (e: FormEvent) => {
    e.preventDefault()
    setSavingSettings(true)
    setSettingsError(null)
    setSettingsSuccess(false)

    try {
      const updates: { name?: string; academic_year?: string; allowed_email_domain?: string | null } = {}

      // Only include changed fields
      if (classroomName !== classroom.name) {
        updates.name = classroomName
      }
      if (academicYear !== classroom.academic_year) {
        updates.academic_year = academicYear
      }
      if (allowedEmailDomain !== (classroom.allowed_email_domain || '')) {
        updates.allowed_email_domain = allowedEmailDomain || null
      }

      if (Object.keys(updates).length === 0) {
        setSettingsError('No changes detected')
        setSavingSettings(false)
        return
      }

      await onUpdateClassroom(updates)
      setSettingsSuccess(true)
      setTimeout(() => setSettingsSuccess(false), 3000)
    } catch (err: any) {
      setSettingsError(err.response?.data?.message || 'Failed to update classroom settings')
    } finally {
      setSavingSettings(false)
    }
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

      {!isCompleted && (
        <div style={{ marginBottom: spacing.lg }}>
          <h5>Classroom Information</h5>
          <form onSubmit={handleSaveClassroomSettings}>
            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="classroom-name">
                <strong>Classroom Name</strong>
              </label>
              <input
                id="classroom-name"
                type="text"
                className="u-full-width"
                value={classroomName}
                onChange={(e) => setClassroomName(e.target.value)}
                required
                maxLength={200}
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="academic-year">
                <strong>Academic Year</strong>
              </label>
              <input
                id="academic-year"
                type="text"
                className="u-full-width"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                required
                maxLength={200}
                placeholder="e.g., 2024-2025"
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="allowed-email-domain">
                <strong>Allowed Email Domain (optional)</strong>
                <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
                  Only users with email addresses from this domain can join. Leave empty to allow all domains.
                </small>
              </label>
              <input
                id="allowed-email-domain"
                type="text"
                className="u-full-width"
                value={allowedEmailDomain}
                onChange={(e) => setAllowedEmailDomain(e.target.value)}
                maxLength={200}
                placeholder="e.g., university.edu"
              />
              {allowedEmailDomain && (
                <small style={{ color: '#666' }}>
                  Only emails ending with @{allowedEmailDomain} will be allowed to join.
                </small>
              )}
            </div>

            {settingsError && (
              <Alert variant="error" message={settingsError} />
            )}

            {settingsSuccess && (
              <Alert variant="success" message="Classroom settings updated successfully!" />
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={savingSettings}
            >
              {savingSettings ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </div>
      )}

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
    <Notes
      classroomUuid={classroom.uuid}
      studentUuid={selectedStudent?.uuid}
      studentName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : undefined}
    />
  )

  return (
    <div style={{padding: '50px' }}>
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
    </div>
  )
}
