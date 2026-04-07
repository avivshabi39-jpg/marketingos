"use client";

import { useState } from "react";
import Link from "next/link";
import type { SetupProgress } from "@/lib/setupProgress";
import { Tooltip } from "@/components/ui/Tooltip";

export function SetupProgressBar({ progress }: { progress: SetupProgress }) {
  const [open, setOpen] = useState(false);

  if (progress.percentage === 100) return null;

  const barColor =
    progress.percentage >= 60
      ? "#6366f1"
      : progress.percentage >= 40
        ? "#f59e0b"
        : "#ef4444";

  return (
    <>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          padding: "10px 20px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", maxWidth: "600px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151", whiteSpace: "nowrap" }}>
            הגדרת המערכת
          </span>
          <div style={{ flex: 1, height: "8px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${progress.percentage}%`,
                background: barColor,
                borderRadius: "999px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: barColor, whiteSpace: "nowrap" }}>
            {progress.percentage}%
          </span>
          <span
            style={{
              fontSize: "12px",
              color: "#9ca3af",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </div>
      </div>

      {open && (
        <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "600px" }}>
            {progress.tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  background: "white",
                  borderRadius: "10px",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: task.completed ? "#dcfce7" : "#f3f4f6",
                    border: task.completed ? "2px solid #22c55e" : "2px solid #e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    flexShrink: 0,
                    color: task.completed ? "#16a34a" : "#6b7280",
                    fontWeight: 700,
                  }}
                >
                  {task.completed ? "✓" : task.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color: task.completed ? "#6b7280" : "#111827",
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.label}
                  </div>
                  {!task.completed && (
                    <div style={{ fontSize: "12px", color: "#9ca3af" }}>{task.description}</div>
                  )}
                </div>
                {!task.completed && (
                  <Tooltip content={`לחץ להשלמת: ${task.label}`} position="left">
                  <Link
                    href={task.actionHref}
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#6366f1",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      padding: "6px 12px",
                      background: "#eef2ff",
                      borderRadius: "8px",
                    }}
                  >
                    {task.actionLabel} →
                  </Link>
                  </Tooltip>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}>
            {progress.completedCount} מתוך {progress.totalCount} משימות הושלמו
          </div>
        </div>
      )}
    </>
  );
}
