"use client";

import { useEffect } from "react";

export default function DashboardEntryPage() {
  useEffect(() => {
    window.location.replace("/?tab=overview");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-700">
      <p className="text-sm">正在进入后台控制台...</p>
    </main>
  );
}
