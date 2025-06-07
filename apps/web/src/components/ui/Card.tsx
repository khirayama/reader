import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  onClick?: () => void
}

export function Card({ children, className = '', title, onClick }: CardProps) {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {title && <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{title}</h3>}
      {children}
    </div>
  )
}
