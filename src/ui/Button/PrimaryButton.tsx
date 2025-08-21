import { ButtonHTMLAttributes, ReactNode } from 'react'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export default function PrimaryButton({
  children,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer ${className}`}
      tabIndex={0}
      {...props}
    >
      {children}
    </button>
  )
}
