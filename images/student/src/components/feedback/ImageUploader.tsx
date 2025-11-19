import { Button } from '../common'

interface ImageUploaderProps {
  isUploading: boolean
  onUpload: (files: FileList | null) => void
  onCancel: () => void
  onStartUpload: () => void
}

export default function ImageUploader({
  isUploading,
  onUpload,
  onCancel,
  onStartUpload
}: ImageUploaderProps) {
  if (isUploading) {
    return (
      <div style={{ marginTop: '10px' }}>
        <input
          type="file"
          accept="image/*"
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
        Add Images
      </Button>
    </div>
  )
}
