import { cn } from "@/lib/utils";

type Color = "gray" | "green" | "blue" | "yellow" | "red";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
  className?: string;
}

const colorClasses: Record<Color, string> = {
  gray: "bg-slate-100 text-slate-600 border border-slate-200",
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  yellow: "bg-amber-50 text-amber-700 border border-amber-200",
  red: "bg-red-50 text-red-700 border border-red-200",
};

export function Badge({ color = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-medium",
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}
