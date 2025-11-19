import type { ReactNode } from 'react'
import type { TimelineItem as TimelineItemType, Feedback, Checkpoint } from '../../types'

interface TimelineProps {
  items: TimelineItemType[]
  renderFeedbackItem: (feedback: Feedback) => ReactNode
  renderCheckpointItem: (checkpoint: Checkpoint) => ReactNode
  emptyMessage?: string
}

export default function Timeline({
  items,
  renderFeedbackItem,
  renderCheckpointItem,
  emptyMessage = 'No items yet.'
}: TimelineProps) {
  if (items.length === 0) {
    return <p>{emptyMessage}</p>
  }

  return (
    <div>
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: '15px',
            marginBottom: '10px',
            borderLeft: item.type === 'checkpoint' ? '4px solid #4CAF50' : '4px solid #333',
            backgroundColor: item.type === 'checkpoint' ? '#e8f5e9' : '#f9f9f9'
          }}
        >
          {item.type === 'checkpoint'
            ? renderCheckpointItem(item.data as Checkpoint)
            : renderFeedbackItem(item.data as Feedback)
          }
        </div>
      ))}
    </div>
  )
}
