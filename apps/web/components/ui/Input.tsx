import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, icon, id, ...props }, ref) => {
    const inputId = id || label

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full bg-white border rounded-xl px-4 py-2.5 text-sm text-slate-900",
              "placeholder:text-slate-400",
              "transition-all duration-150",
              "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 hover:border-slate-300",
              icon && "pr-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-slate-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = "Input"
export { Input }
