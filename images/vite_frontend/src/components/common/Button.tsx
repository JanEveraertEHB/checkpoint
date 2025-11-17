import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'warning' | 'success' | 'info' | 'default'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {},
  danger: { backgroundColor: '#dc3545', color: 'white', border: 'none' },
  warning: { backgroundColor: '#ffc107', color: 'black', border: 'none' },
  success: { backgroundColor: '#28a745', color: 'white', border: 'none' },
  info: { backgroundColor: '#17a2b8', color: 'white', border: 'none' },
  default: {}
}

const sizeStyles: Record<string, React.CSSProperties> = {
  small: { fontSize: '0.8rem', padding: '2px 8px' },
  medium: {},
  large: { fontSize: '1.2rem', padding: '12px 24px' }
}

export default function Button({
  variant = 'default',
  size = 'medium',
  children,
  className = '',
  style = {},
  ...props
}: ButtonProps) {
  const combinedStyle = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style
  }

  const buttonClass = variant === 'primary' ? `button-primary ${className}` : className

  return (
    <button className={buttonClass} style={combinedStyle} {...props}>
      {children}
    </button>
  )
}
