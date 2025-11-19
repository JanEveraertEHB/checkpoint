import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { colors, typography } from '../../styles/theme'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'info' | 'default'
  size?: 'small' | 'medium' | 'large'
  children: ReactNode
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {},
  secondary: { backgroundColor: colors.white, color: colors.black, border: 'none' },
  danger: { backgroundColor: colors.danger, color: colors.white, border: 'none' },
  warning: { backgroundColor: colors.warning, color: colors.black, border: 'none' },
  success: { backgroundColor: colors.success, color: colors.white, border: 'none' },
  info: { backgroundColor: colors.info, color: colors.white, border: 'none' },
  default: {}
}

const sizeStyles: Record<string, React.CSSProperties> = {
  small: { fontSize: typography.fontSizeSm, padding: '2px 8px' },
  medium: {},
  large: { fontSize: typography.fontSizeLg, padding: '12px 24px' }
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
