import * as React from "react"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive' }>(
  ({ className, variant = 'default', ...props }, ref) => {
    let variantStyles = "bg-blue-600 text-white hover:bg-blue-700"
    if (variant === 'outline') variantStyles = " border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-900"
    if (variant === 'ghost') variantStyles = "bg-transparent hover:bg-gray-100 text-gray-900"
    if (variant === 'destructive') variantStyles = "bg-red-600 text-white hover:bg-red-700"

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 ${variantStyles} ${className || ''}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
