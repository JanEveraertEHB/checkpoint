import type { Checkpoint } from '../../types'

interface CheckpointTableProps {
  checkpoints: Checkpoint[]
  onDelete: (uuid: string) => void
}

export default function CheckpointTable({ checkpoints, onDelete }: CheckpointTableProps) {
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
          {checkpoints.map((cp) => (
            <tr key={cp.uuid}>
              <td>{cp.order_index}</td>
              <td><strong>{cp.name}</strong></td>
              <td>{cp.description || '-'}</td>
              <td>
                <a
                  onClick={() => onDelete(cp.uuid)}
                  style={{ color: '#dc3545', cursor: 'pointer' }}
                >
                  Remove
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
