import type { FeedbackDocument } from '../../types'

interface FeedbackDocumentsProps {
  documents: FeedbackDocument[]
  canDelete: boolean
  onDelete: (uuid: string) => void
  getDocumentUrl: (filename: string) => string
}

const getFileIcon = (mimetype: string): string => {
  if (mimetype.includes('pdf')) return '📄'
  if (mimetype.includes('word') || mimetype.includes('document')) return '📝'
  if (mimetype.includes('sheet') || mimetype.includes('excel')) return '📊'
  if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📽️'
  if (mimetype.includes('text')) return '📃'
  return '📎'
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FeedbackDocuments({
  documents,
  canDelete,
  onDelete,
  getDocumentUrl
}: FeedbackDocumentsProps) {
  if (!documents || documents.length === 0) return null

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {documents.map((doc) => (
          <div
            key={doc.uuid}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f9f9f9'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <span style={{ fontSize: '1.5rem' }}>
                {getFileIcon(doc.mimetype)}
              </span>
              <div style={{ flex: 1 }}>
                <a
                  href={getDocumentUrl(doc.filename)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#0066cc',
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  {doc.original_name}
                </a>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                  {formatFileSize(doc.size)}
                </div>
              </div>
            </div>
            {canDelete && (
              <button
                onClick={() => onDelete(doc.uuid)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.8rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                title="Delete document"
              >
                Delete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
