interface InviteCodeDisplayProps {
  code: string
}

export default function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  return (
    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f0f0f0' }}>
      <strong>Invite Code:</strong> {code}<br />
      <small>Share this code with students to join this classroom</small>
    </div>
  )
}
