"use client";

import { useEffect } from "react";

export default function LoginEntryPage() {
  useEffect(() => {
    window.location.replace("/?auth=login");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-center text-slate-700">
      <p className="text-sm">正在打开登录页面...</p>
    </main>
  );
}
