import DOMPurify from 'dompurify'
import { Button, RichTextEditor } from '../common'
import FeedbackImages from './FeedbackImages'
import ImageUploader from './ImageUploader'
import FeedbackDocuments from './FeedbackDocuments'
import DocumentUploader from './DocumentUploader'
import type { Feedback } from '../../types'

interface FeedbackItemProps {
  feedback: Feedback
  isEditing: boolean
  editContent: string
  canEdit: boolean
  canLock: boolean
  canUploadImages: boolean
  isUploadingImages: boolean
  canUploadDocuments: boolean
  isUploadingDocuments: boolean
  onEditStart: () => void
  onEditCancel: () => void
  onEditSave: () => void
  onEditContentChange: (content: string) => void
  onLockToggle: () => void
  onImageDelete: (uuid: string) => void
  onImageUpload: (files: FileList | null) => void
  onStartImageUpload: () => void
  onCancelImageUpload: () => void
  onDocumentDelete: (uuid: string) => void
  onDocumentUpload: (files: FileList | null) => void
  onStartDocumentUpload: () => void
  onCancelDocumentUpload: () => void
  getImageUrl: (filename: string) => string
  getDocumentUrl: (filename: string) => string
  formatDate: (date: string) => string
}

export default function FeedbackItem({
  feedback,
  isEditing,
  editContent,
  canEdit,
  canLock,
  canUploadImages,
  isUploadingImages,
  canUploadDocuments,
  isUploadingDocuments,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditContentChange,
  onLockToggle,
  onImageDelete,
  onImageUpload,
  onStartImageUpload,
  onCancelImageUpload,
  onDocumentDelete,
  onDocumentUpload,
  onStartDocumentUpload,
  onCancelDocumentUpload,
  getImageUrl,
  getDocumentUrl,
  formatDate
}: FeedbackItemProps) {
  if (isEditing) {
    return (
      <div>
        <RichTextEditor value={editContent} onChange={onEditContentChange} />
        <div style={{ marginTop: '10px' }}>
          <Button variant="primary" onClick={onEditSave}>Save</Button>
          <Button onClick={onEditCancel} style={{ marginLeft: '10px' }}>Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        style={{ margin: 0 }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(feedback.content) }}
      />
      <FeedbackImages
        images={feedback.images || []}
        canDelete={canUploadImages}
        onDelete={onImageDelete}
        getImageUrl={getImageUrl}
      />
      <FeedbackDocuments
        documents={feedback.documents || []}
        canDelete={canUploadDocuments}
        onDelete={onDocumentDelete}
        getDocumentUrl={getDocumentUrl}
      />
      <small style={{ color: '#666' }}>
        By {feedback.created_by_first_name} {feedback.created_by_last_name} on {formatDate(feedback.created_at)}
        {feedback.locked && <span style={{ color: '#dc3545', marginLeft: '10px' }}>[Locked]</span>}
      </small>
      <div style={{ marginTop: '10px' }}>
        {canEdit && (
          <Button size="small" onClick={onEditStart} style={{ marginRight: '5px' }}>
            Edit
          </Button>
        )}
        {canLock && (
          <Button
            variant={feedback.locked ? 'success' : 'warning'}
            size="small"
            onClick={onLockToggle}
          >
            {feedback.locked ? 'Unlock' : 'Lock'}
          </Button>
        )}
      </div>
      {canUploadImages && (
        <ImageUploader
          isUploading={isUploadingImages}
          onUpload={onImageUpload}
          onCancel={onCancelImageUpload}
          onStartUpload={onStartImageUpload}
        />
      )}
      {canUploadDocuments && (
        <DocumentUploader
          isUploading={isUploadingDocuments}
          onUpload={onDocumentUpload}
          onCancel={onCancelDocumentUpload}
          onStartUpload={onStartDocumentUpload}
        />
      )}
    </>
  )
}
