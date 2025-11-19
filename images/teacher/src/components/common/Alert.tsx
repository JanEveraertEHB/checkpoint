import type { ReactNode } from 'react'

interface AlertProps {
  type?: 'error' | 'success' | 'warning' | 'info'
  children: ReactNode
}

const alertStyles: Record<string, React.CSSProperties> = {
  error: { color: '#dc3545', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' },
  success: { color: '#155724', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' },
  warning: { color: '#856404', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px' },
  info: { color: '#0c5460', padding: '10px', backgroundColor: '#d1ecf1', borderRadius: '4px' }
}

export default function Alert({ type = 'error', children }: AlertProps) {
  if (!children) return null

  return (
    <div style={alertStyles[type]}>
      {children}
    </div>
  )
}
