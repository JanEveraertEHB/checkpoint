import type { Checkpoint } from '../../types'

interface CheckpointProgressProps {
  checkpoints: Checkpoint[]
  onToggle?: (uuid: string, reached: boolean) => void
  editable?: boolean
}

export default function CheckpointProgress({
  checkpoints,
  onToggle,
  editable = false
}: CheckpointProgressProps) {
  if (checkpoints.length === 0) return null

  return (
    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0' }}>
      <h5>Checkpoint Progress</h5>
      {checkpoints.map((cp) => (
        <div key={cp.uuid} style={{ marginBottom: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: editable ? 'pointer' : 'default' }}>
            {editable && onToggle ? (
              <input
                type="checkbox"
                checked={cp.reached || false}
                onChange={() => onToggle(cp.uuid, cp.reached || false)}
                style={{ marginRight: '10px' }}
              />
            ) : (
              <span style={{ marginRight: '10px' }}>
                {cp.reached ? '✓' : '○'}
              </span>
            )}
            <span style={{ textDecoration: cp.reached ? 'line-through' : 'none' }}>
              {cp.order_index}. {cp.name}
            </span>
          </label>
        </div>
      ))}
    </div>
  )
}
