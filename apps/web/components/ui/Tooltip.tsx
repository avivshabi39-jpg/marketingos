"use client";

import { useState, useRef } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

const POS: Record<string, React.CSSProperties> = {
  top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: "8px" },
  bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px" },
  left: { right: "100%", top: "50%", transform: "translateY(-50%)", marginRight: "8px" },
  right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: "8px" },
};

const ARROW: Record<string, React.CSSProperties> = {
  top: { bottom: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)" },
  bottom: { top: "-4px", left: "50%", transform: "translateX(-50%) rotate(45deg)" },
  left: { right: "-4px", top: "50%", transform: "translateY(-50%) rotate(45deg)" },
  right: { left: "-4px", top: "50%", transform: "translateY(-50%) rotate(45deg)" },
};

export function Tooltip({ content, children, position = "top", delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <div
      style={{ position: "relative", display: "inline-flex" }}
      onMouseEnter={() => {
        timer.current = setTimeout(() => setVisible(true), delay);
      }}
      onMouseLeave={() => {
        if (timer.current) clearTimeout(timer.current);
        setVisible(false);
      }}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "absolute",
            ...POS[position],
            background: "#1f2937",
            color: "white",
            fontSize: "12px",
            fontWeight: 500,
            padding: "6px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            zIndex: 9999,
            pointerEvents: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            direction: "rtl",
          }}
        >
          {content}
          <div
            style={{
              position: "absolute",
              ...ARROW[position],
              width: "8px",
              height: "8px",
              background: "#1f2937",
            }}
          />
        </div>
      )}
    </div>
  );
}
