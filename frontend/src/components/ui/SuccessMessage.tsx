import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface SuccessMessageProps {
  message?: string
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissTime?: number
  className?: string
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  autoDismiss = true,
  autoDismissTime = 5000,
  className
}) => {
  const [visible, setVisible] = useState(!!message)

  useEffect(() => {
    if (message && autoDismiss) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, autoDismissTime)

      return () => clearTimeout(timer)
    }
  }, [message, autoDismiss, autoDismissTime, onDismiss])

  if (!visible || !message) return null

  return (
    <div className={cn(
      'rounded-md bg-green-50 p-4 border border-green-200',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-green-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-green-800">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false)
              onDismiss()
            }}
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
            aria-label="Dismiss success"
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

export { SuccessMessage }