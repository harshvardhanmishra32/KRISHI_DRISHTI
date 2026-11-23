"use client";

import React from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLanding = pathname === "/" || pathname === "/legacy";

  if (isLanding) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC]">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-slate-100 sm:py-6">
      <div className="w-full max-w-[480px] min-h-screen sm:min-h-[840px] bg-white shadow-2xl flex flex-col relative pb-20 sm:rounded-2xl sm:border sm:border-slate-200">
        <main className="flex-1">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
