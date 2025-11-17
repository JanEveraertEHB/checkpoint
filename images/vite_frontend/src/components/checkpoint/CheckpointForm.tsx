import { FormEvent } from 'react'
import { Button } from '../common'

interface CheckpointFormProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
}

export default function CheckpointForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onSubmit,
  onCancel
}: CheckpointFormProps) {
  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd' }}>
      <h4>Add New Checkpoint</h4>
      <form onSubmit={onSubmit}>
        <label htmlFor="checkpointName">Name</label>
        <input
          className="u-full-width"
          type="text"
          id="checkpointName"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
        <label htmlFor="checkpointDescription">Description</label>
        <textarea
          className="u-full-width"
          id="checkpointDescription"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
        />
        <Button variant="primary" type="submit">Create Checkpoint</Button>
        <Button
          type="button"
          onClick={onCancel}
          style={{ marginLeft: '10px' }}
        >
          Cancel
        </Button>
      </form>
    </div>
  )
}
