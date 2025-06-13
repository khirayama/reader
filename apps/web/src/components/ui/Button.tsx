import type React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  // レート制限対応
  rateLimited?: boolean
  rateLimitCountdown?: number
  rateLimitMessage?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  disabled,
  rateLimited = false,
  rateLimitCountdown,
  rateLimitMessage = 'レート制限中',
  ...props
}: ButtonProps) {
  const baseClasses = 'btn'

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    success: 'btn-success',
  }

  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const LoadingIcon = () => (
    <svg
      className="animate-spin h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingIcon />
          <span className="ml-1.5">{children}</span>
        </>
      )
    }

    if (rateLimited) {
      return (
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1.5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
          <span>
            {rateLimitMessage}
            {rateLimitCountdown && rateLimitCountdown > 0 && (
              <span className="ml-1 font-mono text-xs">
                ({rateLimitCountdown}s)
              </span>
            )}
          </span>
        </div>
      )
    }

    if (!icon) {
      return children
    }

    if (iconPosition === 'right') {
      return (
        <>
          <span>{children}</span>
          <span className="ml-1.5 flex-shrink-0">{icon}</span>
        </>
      )
    }

    return (
      <>
        <span className="mr-1.5 flex-shrink-0">{icon}</span>
        <span>{children}</span>
      </>
    )
  }

  return (
    <button 
      className={classes} 
      disabled={loading || disabled || rateLimited} 
      aria-busy={loading}
      title={rateLimited ? `${rateLimitMessage}${rateLimitCountdown ? ` (あと${rateLimitCountdown}秒)` : ''}` : undefined}
      {...props}
    >
      {renderContent()}
    </button>
  )
}
