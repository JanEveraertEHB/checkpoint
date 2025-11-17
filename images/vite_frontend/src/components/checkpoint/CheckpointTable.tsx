import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Checkpoint } from '../../types'

interface CheckpointTableProps {
  checkpoints: Checkpoint[]
  onDelete: (uuid: string) => void
  onEdit?: (uuid: string, name: string, description: string) => Promise<void>
  onReorder?: (uuid: string, newOrderIndex: number) => Promise<void>
  canReorder?: boolean
}

export default function CheckpointTable({ checkpoints, onDelete, onEdit, onReorder, canReorder = true }: CheckpointTableProps) {
  const [editingUuid, setEditingUuid] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  const handleStartEdit = (cp: Checkpoint) => {
    setEditingUuid(cp.uuid)
    setEditName(cp.name)
    setEditDescription(cp.description || '')
  }

  const handleCancelEdit = () => {
    setEditingUuid(null)
    setEditName('')
    setEditDescription('')
  }

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingUuid || !onEdit || !editName.trim()) return
    await onEdit(editingUuid, editName, editDescription)
    handleCancelEdit()
  }

  const handleMoveUp = async (cp: Checkpoint, index: number) => {
    if (!onReorder || index === 0) return
    const prevCp = checkpoints[index - 1]
    // Swap order indices
    await onReorder(cp.uuid, prevCp.order_index)
    await onReorder(prevCp.uuid, cp.order_index)
  }

  const handleMoveDown = async (cp: Checkpoint, index: number) => {
    if (!onReorder || index === checkpoints.length - 1) return
    const nextCp = checkpoints[index + 1]
    // Swap order indices
    await onReorder(cp.uuid, nextCp.order_index)
    await onReorder(nextCp.uuid, cp.order_index)
  }

  if (checkpoints.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>Checkpoints</h4>
      <table className="u-full-width">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {checkpoints.map((cp, index) => (
            <tr key={cp.uuid}>
              {editingUuid === cp.uuid ? (
                <>
                  <td>{cp.order_index}</td>
                  <td>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      style={{ marginBottom: 0, width: '100%' }}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      style={{ marginBottom: 0, width: '100%' }}
                      placeholder="Description (optional)"
                    />
                  </td>
                  <td>
                    <a
                      onClick={handleSaveEdit}
                      style={{ color: '#28a745', cursor: 'pointer', marginRight: '10px' }}
                    >
                      Save
                    </a>
                    <a
                      onClick={handleCancelEdit}
                      style={{ color: '#6c757d', cursor: 'pointer' }}
                    >
                      Cancel
                    </a>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    {cp.order_index}
                    {onReorder && canReorder && (
                      <span style={{ marginLeft: '8px' }}>
                        <a
                          onClick={() => handleMoveUp(cp, index)}
                          style={{
                            color: index === 0 ? '#ccc' : '#007bff',
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            marginRight: '4px',
                            fontSize: '14px'
                          }}
                        >
                          ▲
                        </a>
                        <a
                          onClick={() => handleMoveDown(cp, index)}
                          style={{
                            color: index === checkpoints.length - 1 ? '#ccc' : '#007bff',
                            cursor: index === checkpoints.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          ▼
                        </a>
                      </span>
                    )}
                  </td>
                  <td><strong>{cp.name}</strong></td>
                  <td>{cp.description || '-'}</td>
                  <td>
                    {onEdit && (
                      <a
                        onClick={() => handleStartEdit(cp)}
                        style={{ color: '#007bff', cursor: 'pointer', marginRight: '10px' }}
                      >
                        Edit
                      </a>
                    )}
                    <a
                      onClick={() => onDelete(cp.uuid)}
                      style={{ color: '#dc3545', cursor: 'pointer' }}
                    >
                      Remove
                    </a>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
