import { cn } from "@/lib/utils";

type Color = "gray" | "green" | "blue" | "yellow" | "red";

interface BadgeProps {
  color?: Color;
  children: React.ReactNode;
  className?: string;
}

const colorClasses: Record<Color, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};

export function Badge({ color = "gray", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClasses[color],
        className
      )}
    >
      {children}
    </span>
  );
}
