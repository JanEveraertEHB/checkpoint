import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../common'
import { colors, spacing, typography } from '../../styles/theme'
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
                    <Button
                      variant="success"
                      size="small"
                      onClick={handleSaveEdit}
                      style={{ marginRight: spacing.xs }}
                    >
                      Save
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                  </td>
                </>
              ) : (
                <>
                  <td>
                    {cp.order_index}
                    {onReorder && canReorder && (
                      <span style={{ marginLeft: spacing.sm }}>
                        <a
                          onClick={() => handleMoveUp(cp, index)}
                          style={{
                            color: index === 0 ? colors.gray400 : colors.primary,
                            cursor: index === 0 ? 'not-allowed' : 'pointer',
                            marginRight: '4px',
                            fontSize: typography.fontSizeBase
                          }}
                        >
                          ▲
                        </a>
                        <a
                          onClick={() => handleMoveDown(cp, index)}
                          style={{
                            color: index === checkpoints.length - 1 ? colors.gray400 : colors.primary,
                            cursor: index === checkpoints.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: typography.fontSizeBase
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
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleStartEdit(cp)}
                        style={{ marginRight: spacing.xs }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => onDelete(cp.uuid)}
                    >
                      Remove
                    </Button>
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
