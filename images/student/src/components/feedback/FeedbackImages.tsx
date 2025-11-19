import { useState } from 'react'
import { ImageModal } from '../common'
import type { FeedbackImage } from '../../types'

interface FeedbackImagesProps {
  images: FeedbackImage[]
  canDelete: boolean
  onDelete: (uuid: string) => void
  getImageUrl: (filename: string) => string
}

export default function FeedbackImages({
  images,
  canDelete,
  onDelete,
  getImageUrl
}: FeedbackImagesProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt: string } | null>(null)

  if (!images || images.length === 0) return null

  return (
    <>
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {images.map((img) => (
            <div key={img.uuid} style={{ position: 'relative' }}>
              <img
                src={getImageUrl(img.filename)}
                alt={img.original_name}
                style={{
                  maxWidth: '200px',
                  maxHeight: '150px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedImage({ url: getImageUrl(img.filename), alt: img.original_name })}
                title="Click to view full size"
              />
              {canDelete && (
                <button
                  onClick={() => onDelete(img.uuid)}
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Delete image"
                >
                  X
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          altText={selectedImage.alt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </>
  )
}
