"use client";

import React, { useEffect, useState } from "react";
import { Sprout } from "lucide-react";

/**
 * PageTransitionWipe:
 * Listens for route transitions and plays a circular sprout wipe
 * before navigation completes, creating an organic studio transition.
 */
export default function PageTransitionWipe() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleStart = () => {
      setActive(true);
    };
    const handleEnd = () => {
      setTimeout(() => setActive(false), 300);
    };

    window.addEventListener("krishi:navigate-start", handleStart);
    window.addEventListener("krishi:navigate-end", handleEnd);

    return () => {
      window.removeEventListener("krishi:navigate-start", handleStart);
      window.removeEventListener("krishi:navigate-end", handleEnd);
    };
  }, []);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-[#214F3F] transition-opacity duration-300 animate-in fade-in"
    >
      <div className="flex flex-col items-center gap-3 text-emerald-300">
        <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center animate-bounce">
          <Sprout className="w-7 h-7 stroke-[2.2]" />
        </div>
        <span className="text-xs font-mono font-semibold text-emerald-200">
          Loading Krishi Telemetry...
        </span>
      </div>
    </div>
  );
}
