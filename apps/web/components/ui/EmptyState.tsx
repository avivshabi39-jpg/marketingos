import Link from "next/link";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center" dir="rtl">
      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-4xl mb-5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed mb-6">
        {subtitle}
      </p>
      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-none rounded-xl text-sm font-semibold cursor-pointer transition-colors duration-150 shadow-sm hover:shadow-md"
          >
            {actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
