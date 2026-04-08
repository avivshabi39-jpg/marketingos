import { cn } from "@/lib/utils"

interface CardProps {
  className?: string
  children: React.ReactNode
  hover?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

export function Card({ className, children, hover = false, padding = "md" }: CardProps) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-100",
      "shadow-[0_1px_3px_rgba(0,0,0,0.06)]",
      hover && "hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-200 cursor-pointer",
      paddings[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface KPICardProps {
  title: string
  value: string | number
  trend?: number
  icon?: React.ReactNode
  color?: "blue" | "green" | "orange" | "red" | "purple"
  /** @deprecated use color */
  iconBg?: string
  /** @deprecated use color */
  iconColor?: string
}

export function KPICard({ title, value, trend, icon, color = "blue", iconBg, iconColor }: KPICardProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  }

  // Support legacy iconBg/iconColor props
  const iconClasses = iconBg && iconColor
    ? `${iconBg} ${iconColor}`
    : colors[color]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        {icon && (
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", iconClasses)}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">{value}</p>
      {trend !== undefined && (
        <p className={cn("text-xs font-medium flex items-center gap-1", trend >= 0 ? "text-emerald-600" : "text-red-500")}>
          {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% מהחודש שעבר
        </p>
      )}
    </div>
  )
}
