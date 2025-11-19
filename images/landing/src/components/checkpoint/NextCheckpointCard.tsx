import type { Checkpoint } from '../../types'

interface NextCheckpointCardProps {
  checkpoint: Checkpoint
}

export default function NextCheckpointCard({ checkpoint }: NextCheckpointCardProps) {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '20px',
      backgroundColor: '#fff3cd',
      border: '2px solid #ffc107',
      borderRadius: '5px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>Next Checkpoint</h4>
      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
        {checkpoint.name}
      </p>
      {checkpoint.description && (
        <p style={{ margin: '10px 0 0 0', color: '#666' }}>
          {checkpoint.description}
        </p>
      )}
    </div>
  )
}
