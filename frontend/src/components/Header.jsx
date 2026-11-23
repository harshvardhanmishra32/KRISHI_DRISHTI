"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { hapticLight } from "../lib/haptics";

export default function Header({
  title,
  showBack = true,
  rightElement,
  className = "",
}) {
  const router = useRouter();

  const handleBack = () => {
    hapticLight();
    router.back();
  };

  return (
    <header
      className={`sticky top-0 z-30 glass-header px-4 py-3 flex items-center justify-between transition-all duration-200 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            onPointerDown={hapticLight}
            aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 bg-slate-100/70 hover:bg-slate-200/80 active:scale-90 active:bg-slate-300/80 transition-all duration-150 ease-spring"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
        )}
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight truncate leading-tight">
          {title}
        </h1>
      </div>
      <div>{rightElement || <LanguageSwitcher />}</div>
    </header>
  );
}
