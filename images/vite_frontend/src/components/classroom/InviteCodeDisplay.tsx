import { useState } from 'react'

interface InviteCodeDisplayProps {
  code: string
}

export default function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const inviteLink = `${window.location.origin}/join/${code}`

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
      <div style={{ marginBottom: '10px' }}>
        <strong>Invite Code:</strong>{' '}
        <code style={{ backgroundColor: '#fff', padding: '2px 6px', borderRadius: '3px' }}>{code}</code>
        <button
          onClick={() => copyToClipboard(code, 'code')}
          style={{
            marginLeft: '10px',
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {copied === 'code' ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <strong>Invite Link:</strong><br />
        <input
          type="text"
          value={inviteLink}
          readOnly
          style={{
            width: '100%',
            padding: '5px',
            marginTop: '5px',
            marginBottom: '5px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '3px'
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          onClick={() => copyToClipboard(inviteLink, 'link')}
          style={{
            padding: '2px 8px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          {copied === 'link' ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
      <small style={{ color: '#666' }}>
        Share this code or link with students to join this classroom
      </small>
    </div>
  )
}
