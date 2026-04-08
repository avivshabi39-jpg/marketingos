import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => {

    const base = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"

    const variants = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md",
      secondary: "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm",
      danger: "bg-white text-red-600 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600",
      ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
      outline: "border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white",
    }

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3 text-base",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>טוען...</span>
          </>
        ) : (
          <>
            {icon && <span className="w-4 h-4">{icon}</span>}
            {children}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"
export { Button }
export type { ButtonProps }
