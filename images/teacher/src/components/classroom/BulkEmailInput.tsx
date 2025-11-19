import { useState } from 'react'
import { Button } from '../common'
import { colors, spacing } from '../../styles/theme'
import { addStudentsByEmail } from '../../services/api'

interface BulkEmailInputProps {
  classroomUuid: string
  onSuccess: () => void
}

// Email regex pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

export default function BulkEmailInput({ classroomUuid, onSuccess }: BulkEmailInputProps) {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Parse and extract emails from input text
  const extractEmails = (text: string): string[] => {
    const matches = text.match(EMAIL_REGEX) || []
    // Deduplicate by converting to Set and back to array
    const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase()))]
    return uniqueEmails
  }

  const handleSubmit = async () => {
    setError('')
    setResult(null)

    const emails = extractEmails(inputText)

    if (emails.length === 0) {
      setError('No valid email addresses found')
      return
    }

    setLoading(true)

    try {
      const response = await addStudentsByEmail(classroomUuid, emails)
      setResult(response.data)
      setInputText('') // Clear input on success
      onSuccess() // Refresh classroom data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add students')
    } finally {
      setLoading(false)
    }
  }

  const parsedEmails = inputText ? extractEmails(inputText) : []

  return (
    <div style={{ marginTop: spacing.md }}>
      <h4 style={{ marginBottom: spacing.sm }}>Add Students by Email</h4>
      <p style={{ color: colors.textSecondary, marginBottom: spacing.sm, fontSize: '14px' }}>
        Paste email addresses below (one per line or separated by commas/spaces), any email recognised will be added to the class.
        Students will be added immediately if they have an account, or invited to join when they register.
      </p>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="student1@example.com&#10;student2@example.com&#10;student3@example.com"
        rows={6}
        style={{
          width: '100%',
          padding: spacing.sm,
          borderRadius: '4px',
          border: `1px solid ${colors.gray300}`,
          fontFamily: 'monospace',
          fontSize: '14px'
        }}
      />

      {parsedEmails.length > 0 && (
        <div style={{ marginTop: spacing.sm, marginBottom: spacing.sm }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Found {parsedEmails.length} email{parsedEmails.length !== 1 ? 's' : ''}:
          </p>
          <div style={{
            maxHeight: '150px',
            overflowY: 'auto',
            backgroundColor: colors.bgLight,
            padding: spacing.sm,
            borderRadius: '4px',
            fontSize: '13px',
            fontFamily: 'monospace'
          }}>
            {parsedEmails.map((email, idx) => (
              <div key={idx}>{email}</div>
            ))}
          </div>
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: spacing.sm }}>{error}</p>}

      {result && (
        <div style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.bgLight, borderRadius: '4px' }}>
          <h5 style={{ marginBottom: spacing.xs }}>Results:</h5>
          {result.added?.length > 0 && (
            <p style={{ color: 'green' }}>
              ✓ {result.added.length} student{result.added.length !== 1 ? 's' : ''} added immediately
            </p>
          )}
          {result.pending?.length > 0 && (
            <p style={{ color: colors.primary }}>
              → {result.pending.length} invitation{result.pending.length !== 1 ? 's' : ''} sent (will join on registration)
            </p>
          )}
          {result.alreadyMembers?.length > 0 && (
            <p style={{ color: colors.textSecondary }}>
              ℹ {result.alreadyMembers.length} already member{result.alreadyMembers.length !== 1 ? 's' : ''}
            </p>
          )}
          {result.errors?.length > 0 && (
            <div>
              <p style={{ color: 'red' }}>✗ {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}:</p>
              <ul style={{ marginLeft: spacing.md, fontSize: '13px' }}>
                {result.errors.map((err: any, idx: number) => (
                  <li key={idx}>{err.email}: {err.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: spacing.md }}>
        <Button
          onClick={handleSubmit}
          disabled={loading || parsedEmails.length === 0}
        >
          {loading ? 'Adding...' : `Add ${parsedEmails.length} Email${parsedEmails.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  )
}
