"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({
  title,
  showBack = true,
  rightElement,
  className = "",
}) {
  const router = useRouter();

  return (
    <header
      className={`sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-krishi-border px-4 py-3 flex items-center justify-between shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Go back"
            className="w-10 h-10 rounded-full flex items-center justify-center text-krishi-text hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base font-bold text-krishi-text tracking-tight truncate">
          {title}
        </h1>
      </div>
      <div>{rightElement || <LanguageSwitcher />}</div>
    </header>
  );
}
