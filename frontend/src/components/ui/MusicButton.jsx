"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { toggleFieldAudio, subscribeAudioState } from "../../lib/fieldAudio";
import { hapticLight } from "../../lib/haptics";

/**
 * Universal Music Button Component
 * Plays / pauses Hans Zimmer's Interstellar Soundtrack across every page
 * Synchronized globally across Dashboard, Login, Signup, Scan, and all subpages.
 */
export default function MusicButton({
  compact = false,
  className = "",
  showLabel = false,
}) {
  const [audioActive, setAudioActive] = useState(false);

  useEffect(() => {
    // Subscribe to global soundtrack state
    const unsubscribe = subscribeAudioState((active) => {
      setAudioActive(active);
    });
    return () => unsubscribe();
  }, []);

  const handleClick = (e) => {
    e.stopPropagation();
    hapticLight();
    toggleFieldAudio();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        audioActive
          ? "Pause Interstellar Soundtrack"
          : "Play Interstellar Main Theme by Hans Zimmer"
      }
      title={
        audioActive
          ? "Interstellar Theme Playing (Click to pause)"
          : "Play Interstellar Theme - Hans Zimmer"
      }
      className={`relative inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none ${
        compact
          ? "w-9 h-9 rounded-full border shadow-2xs"
          : "px-2.5 py-1.5 rounded-xl border text-xs font-semibold gap-1.5 shadow-2xs"
      } ${
        audioActive
          ? "bg-emerald-100/90 border-emerald-400 text-emerald-800 shadow-emerald-500/20 shadow-xs"
          : "bg-white/90 border-slate-200/90 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95"
      } ${className}`}
    >
      {audioActive ? (
        <>
          <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
          {/* Animated Mini Equalizer bars */}
          <span className="flex items-end gap-0.5 h-3 ml-0.5">
            <span className="w-0.5 bg-emerald-600 rounded-full animate-pulse h-2"></span>
            <span className="w-0.5 bg-emerald-600 rounded-full animate-bounce h-3"></span>
            <span className="w-0.5 bg-emerald-600 rounded-full animate-pulse h-1.5"></span>
          </span>
          {showLabel && (
            <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-900 hidden sm:inline">
              Interstellar
            </span>
          )}
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-slate-500" />
          {showLabel && (
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 hidden sm:inline">
              Music
            </span>
          )}
        </>
      )}
    </button>
  );
}
