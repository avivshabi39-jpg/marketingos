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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
        direction: "rtl",
      }}
    >
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "var(--bg-hover)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "36px",
          marginBottom: "20px",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 8px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          margin: "0 0 24px",
          maxWidth: "280px",
          lineHeight: 1.6,
        }}
      >
        {subtitle}
      </p>
      {actionLabel &&
        (actionHref ? (
          <Link
            href={actionHref}
            style={{
              display: "inline-block",
              padding: "11px 24px",
              background: "#6366f1",
              color: "white",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button
            onClick={onAction}
            style={{
              padding: "11px 24px",
              background: "#6366f1",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
