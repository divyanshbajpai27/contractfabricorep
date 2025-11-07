import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  closeOnOverlayClick = true,
  closeOnEscape = true
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose, closeOnEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => closeOnOverlayClick && onClose()}
      />

      {/* Modal Content */}
      <div className={cn(
        'relative z-50 w-full max-w-lg mx-4 bg-white rounded-lg shadow-xl',
        'transform transition-all duration-200 scale-100',
        'max-h-[90vh] overflow-y-auto',
        className
      )}>
        {children}
      </div>
    </div>
  )
}

export interface ModalHeaderProps {
  title?: string
  onClose: () => void
  className?: string
}

const ModalHeader: React.FC<ModalHeaderProps> = ({ title, onClose, className }) => (
  <div className={cn(
    'flex items-center justify-between p-6 border-b border-gray-200',
    className
  )}>
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <button
      onClick={onClose}
      className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-md hover:bg-gray-100"
      aria-label="Close modal"
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
  </div>
)

export interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => (
  <div className={cn('p-6', className)}>
    {children}
  </div>
)

export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
}

const ModalFooter: React.FC<ModalFooterProps> = ({ children, className }) => (
  <div className={cn(
    'flex items-center justify-end gap-3 p-6 border-t border-gray-200',
    className
  )}>
    {children}
  </div>
)

export { Modal, ModalHeader, ModalBody, ModalFooter }