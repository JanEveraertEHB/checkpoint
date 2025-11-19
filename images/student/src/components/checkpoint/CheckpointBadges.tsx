import type { Checkpoint } from '../../types'

interface CheckpointBadgesProps {
  checkpoints: Checkpoint[]
}

export default function CheckpointBadges({ checkpoints }: CheckpointBadgesProps) {
  if (checkpoints.length === 0) return null

  return (
    <div style={{ marginBottom: '20px' }}>
      <h4>Your Progress</h4>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {checkpoints.map((cp) => (
          <div
            key={cp.uuid}
            style={{
              padding: '10px 15px',
              backgroundColor: cp.reached ? '#4CAF50' : '#ddd',
              color: cp.reached ? 'white' : '#666',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}
          >
            {cp.order_index}. {cp.name}
          </div>
        ))}
      </div>
    </div>
  )
}
