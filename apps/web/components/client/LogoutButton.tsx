"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/client-auth/login", { method: "DELETE" });
    router.push("/client/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
    >
      <LogOut size={15} />
      יציאה
    </button>
  );
}
