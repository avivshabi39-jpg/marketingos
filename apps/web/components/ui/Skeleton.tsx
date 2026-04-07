import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--bg-hover) 25%, var(--border-color) 50%, var(--bg-hover) 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export function LeadCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <Skeleton width="60%" height={16} />
      <Skeleton width="40%" height={13} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton width={60} height={22} borderRadius={6} />
        <Skeleton width={80} height={13} />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-color)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <Skeleton width="50%" height={13} />
      <Skeleton width="35%" height={28} />
      <Skeleton width="60%" height={12} />
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "12px 16px", borderBottom: "1px solid #f9fafb" }}>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton width="70%" height={13} />
        <Skeleton width="90%" height={12} />
        <Skeleton width="30%" height={11} />
      </div>
    </div>
  );
}

export function BroadcastCardSkeleton() {
  return (
    <div style={{ background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-color)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <Skeleton width="40%" height={15} />
        <Skeleton width={60} height={22} borderRadius={6} />
      </div>
      <Skeleton width="80%" height={13} />
      <Skeleton width="30%" height={12} />
    </div>
  );
}
