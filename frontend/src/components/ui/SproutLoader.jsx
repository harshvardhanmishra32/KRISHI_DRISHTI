"use client";

import React, { useEffect, useState } from "react";
import { Sprout } from "lucide-react";

/**
 * SproutLoader:
 * - Animated 0% to 100% growth counter while 3D assets & shaders initialize.
 * - Sprout scales organically with percentage progress.
 * - Smooth "lift-away" wipe reveal (translate-y-full + opacity fade) into the hero world.
 */
export default function SproutLoader({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Smooth progress increment from 0 to 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Rapid easing to 100% in ~800ms
        const step = Math.max(2, Math.floor((100 - prev) * 0.22));
        return Math.min(100, prev + step);
      });
    }, 45);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      // Once 100% is reached, wait 150ms then trigger the cinematic lift-away reveal
      const liftTimer = setTimeout(() => {
        setLifting(true);
        const hideTimer = setTimeout(() => {
          setHidden(true);
          if (onComplete) onComplete();
        }, 650);
        return () => clearTimeout(hideTimer);
      }, 150);

      return () => clearTimeout(liftTimer);
    }
  }, [progress, onComplete]);

  if (hidden) return null;

  return (
    <div
      aria-hidden={lifting}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        lifting
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100 pointer-events-auto"
      }`}
    >
      <div className="relative flex flex-col items-center gap-5 select-none">
        {/* Organic Growing Sprout Emblem */}
        <div className="relative w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200/90 flex items-center justify-center text-krishi-green shadow-apple-card">
          {/* Subtle Ring Progress */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-emerald-100"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-emerald-600 transition-all duration-150 ease-out"
              strokeWidth="4"
              strokeDasharray={276.4}
              strokeDashoffset={276.4 - (276.4 * progress) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Sprout Icon Scaling with Growth */}
          <div
            style={{
              transform: `scale(${0.65 + (progress / 100) * 0.45})`,
              transition: "transform 150ms ease-out",
            }}
          >
            <Sprout className="w-9 h-9 stroke-[2.2] text-krishi-green" />
          </div>
        </div>

        {/* Brand & Dynamic Percentage Readout */}
        <div className="text-center space-y-1.5">
          <span className="text-base font-extrabold tracking-tight text-slate-900 block">
            Krishi Drishti
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
              {progress}%
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              कृषि दृष्टि • 3D Field Initialization
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
