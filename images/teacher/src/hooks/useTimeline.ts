import { useMemo } from 'react'
import type { Feedback, Checkpoint, TimelineItem } from '../types'

export function useTimeline(feedback: Feedback[], studentProgress: Checkpoint[]) {
  const timeline = useMemo(() => {
    const items: TimelineItem[] = []

    // Add feedback items
    feedback.forEach(fb => {
      items.push({
        type: 'feedback',
        date: fb.created_at,
        data: fb
      })
    })

    // Add reached checkpoints
    studentProgress.forEach(cp => {
      if (cp.reached && cp.reached_at) {
        items.push({
          type: 'checkpoint',
          date: cp.reached_at,
          data: cp
        })
      }
    })

    // Sort by date descending
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return items
  }, [feedback, studentProgress])

  return timeline
}
