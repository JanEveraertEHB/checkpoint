import { useState } from 'react'
import { Button } from '../common'
import { colors, spacing, borderRadius, typography } from '../../styles/theme'

interface InviteCodeDisplayProps {
  code: string
}

export default function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const inviteLink = `https://checkpoint.academy/join/${code}`

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div style={{
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.bgMuted,
      borderRadius: borderRadius.md
    }}>
      <div style={{ marginBottom: spacing.sm }}>
        <strong>Invite Code:</strong>{' '}
        <code style={{
          backgroundColor: colors.white,
          padding: '2px 6px',
          borderRadius: borderRadius.sm
        }}>
          {code}
        </code>
        <Button
          size="small"
          onClick={() => copyToClipboard(code, 'code')}
          style={{ marginLeft: spacing.sm }}
        >
          {copied === 'code' ? 'Copied!' : 'Copy Code'}
        </Button>
      </div>
      <div style={{ marginBottom: spacing.sm }}>
        <strong>Invite Link:</strong><br />
        <input
          type="text"
          value={inviteLink}
          readOnly
          style={{
            width: '100%',
            padding: spacing.xs,
            marginTop: spacing.xs,
            marginBottom: spacing.xs,
            backgroundColor: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.sm,
            fontSize: typography.fontSizeBase
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          size="small"
          onClick={() => copyToClipboard(inviteLink, 'link')}
        >
          {copied === 'link' ? 'Copied!' : 'Copy Link'}
        </Button>
      </div>
      <small style={{ color: colors.textSecondary, fontSize: typography.fontSizeSm }}>
        Share this code or link with students to join this classroom
      </small>
    </div>
  )
}
