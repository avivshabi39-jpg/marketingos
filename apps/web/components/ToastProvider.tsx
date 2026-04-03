"use client";

import { Toaster } from "react-hot-toast";

// ספק טוסטים גלובלי — מתווסף ל-root layout
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-left"
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: "inherit",
          fontSize: "14px",
          direction: "rtl",
          textAlign: "right",
        },
        success: {
          style: {
            background: "#22c55e",
            color: "white",
          },
          iconTheme: { primary: "white", secondary: "#22c55e" },
        },
        error: {
          style: {
            background: "#ef4444",
            color: "white",
          },
          iconTheme: { primary: "white", secondary: "#ef4444" },
        },
      }}
    />
  );
}
