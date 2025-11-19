import { Button } from '../common'

interface DocumentUploaderProps {
  isUploading: boolean
  onUpload: (files: FileList | null) => void
  onCancel: () => void
  onStartUpload: () => void
}

export default function DocumentUploader({
  isUploading,
  onUpload,
  onCancel,
  onStartUpload
}: DocumentUploaderProps) {
  if (isUploading) {
    return (
      <div style={{ marginTop: '10px' }}>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          multiple
          onChange={(e) => onUpload(e.target.files)}
          style={{ marginBottom: '5px' }}
        />
        <Button size="small" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <Button variant="info" size="small" onClick={onStartUpload}>
        Add Documents
      </Button>
    </div>
  )
}
