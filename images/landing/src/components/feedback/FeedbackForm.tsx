import type { FormEvent } from 'react'
import { Button, RichTextEditor } from '../common'

interface FeedbackFormProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  placeholder?: string
  label?: string
  submitText?: string
}

export default function FeedbackForm({
  value,
  onChange,
  onSubmit,
  placeholder = 'Write your feedback here...',
  label = 'Add Feedback',
  submitText = 'Add Feedback'
}: FeedbackFormProps) {
  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }}>
      <label>{label}</label>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <Button variant="primary" type="submit">{submitText}</Button>
    </form>
  )
}
