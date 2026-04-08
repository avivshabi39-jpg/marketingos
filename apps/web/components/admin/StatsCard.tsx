import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: string;
  className?: string;
}

export function StatsCard({ title, value, delta, positive, icon, className }: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 p-6 shadow-sm", className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {delta && (
        <p className={cn("mt-1 text-sm", positive ? "text-green-600" : "text-red-600")}>
          {positive ? "↑" : "↓"} {delta}
        </p>
      )}
    </div>
  );
}
