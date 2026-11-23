"use client";

import React, { useEffect, useRef } from "react";
import { getActiveChapter, CHAPTERS } from "../../lib/scrollTimeline";
import { useLanguage } from "../../context/LanguageContext";
import { playChapterTick } from "../../lib/fieldAudio";
import { hapticLight } from "../../lib/haptics";

export default function ScrollProgress({ progress = 0, onScrollTo }) {
  const { language } = useLanguage();
  const activeChapter = getActiveChapter(progress);
  const prevChapterNum = useRef(activeChapter.number);

  // Play subtle chapter tick when crossing chapter thresholds
  useEffect(() => {
    if (activeChapter.number !== prevChapterNum.current) {
      prevChapterNum.current = activeChapter.number;
      playChapterTick();
    }
  }, [activeChapter.number]);

  // Global Keyboard Arrow Navigation between chapters
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target.isContentEditable
      ) {
        return;
      }

      const currentIndex = CHAPTERS.findIndex((c) => c.number === activeChapter.number);

      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        if (currentIndex < CHAPTERS.length - 1) {
          e.preventDefault();
          hapticLight();
          const nextCh = CHAPTERS[currentIndex + 1];
          onScrollTo?.(nextCh.start);
        }
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        if (currentIndex > 0) {
          e.preventDefault();
          hapticLight();
          const prevCh = CHAPTERS[currentIndex - 1];
          onScrollTo?.(prevCh.start);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeChapter.number, onScrollTo]);

  return (
    <>
      {/* 1. Top Fixed Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-slate-200/50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-emerald-600 via-[#7EE0B0] to-emerald-500 shadow-[0_0_8px_rgba(126,224,176,0.6)] transition-all duration-75 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>

      {/* 2. Right-Hand Floating Chapter HUD Indicator & Clickable Dot Trail (Desktop) */}
      <div
        className="fixed right-6 xl:right-8 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-end gap-3 select-none"
        style={{ marginRight: "env(safe-area-inset-right, 0px)" }}
      >
        {/* Active Chapter Name Pill */}
        <div className="px-3.5 py-1.5 rounded-full bg-white/92 backdrop-blur-md border border-slate-200/90 shadow-md shadow-emerald-950/5 flex items-center gap-2.5 transition-all">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-mono font-bold text-slate-700 tracking-tight">
            {String(activeChapter.number).padStart(2, "0")} / {String(CHAPTERS.length).padStart(2, "0")}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            {language === "hi" ? activeChapter.titleHi : activeChapter.titleEn}
          </span>
        </div>

        {/* 8 Clickable Chapter Dots Trail */}
        <div
          role="navigation"
          aria-label="Story Chapter Navigation"
          className="p-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-xs flex flex-col items-center gap-2"
        >
          {CHAPTERS.map((ch) => {
            const isActive = ch.number === activeChapter.number;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  hapticLight();
                  onScrollTo?.(ch.start);
                }}
                title={`Chapter ${ch.number}: ${language === "hi" ? ch.titleHi : ch.titleEn}`}
                aria-label={`Jump to Chapter ${ch.number}: ${ch.titleEn}`}
                className={`transition-all duration-300 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isActive
                    ? "w-2.5 h-6 bg-emerald-600 shadow-xs ring-2 ring-emerald-300/80"
                    : "w-2 h-2 bg-slate-300 hover:bg-emerald-400 hover:scale-125"
                }`}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
