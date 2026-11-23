"use client";

import React from "react";
import { Sprout, ArrowRight, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import Button from "../Button";
import MagneticButton from "../ui/MagneticButton";

export default function FinalCTAChapter({
  onDemoClick,
  onSignupClick,
  user,
  t,
}) {
  return (
    <section className="min-h-[100dvh] flex flex-col justify-between px-4 sm:px-8 pt-28 pb-10 bg-[#214F3F] text-white select-none relative overflow-hidden">
      {/* Subtle Background Radial Mint Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center space-y-6 my-auto relative z-10">
        
        {/* Brand Sprout Icon with luminous glass ring */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300 shadow-apple-float">
          <Sprout className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Deploy Precision Agritech to Your Field Today
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto font-normal leading-relaxed">
          Instant 1-click evaluation with pre-seeded Uttar Pradesh farms, real-time leaf diagnostic telemetry, and bilingual speech intelligence.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4 max-w-md mx-auto">
          <MagneticButton>
            <button
              type="button"
              onClick={onDemoClick}
              className="w-full sm:w-auto h-14 px-8 bg-white text-emerald-950 font-bold rounded-2xl hover:bg-slate-100 active:scale-95 transition-all text-sm shadow-apple-card cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>1-Click Instant Demo</span>
            </button>
          </MagneticButton>
          
          <MagneticButton>
            <button
              type="button"
              onClick={onSignupClick}
              className="w-full sm:w-auto h-14 px-8 bg-emerald-800/80 text-white border border-emerald-600/80 font-bold rounded-2xl hover:bg-emerald-700 active:scale-95 transition-all text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </MagneticButton>
        </div>

        {/* College Viva Architecture & System Specs Badge */}
        <div className="pt-10 border-t border-emerald-800/80 text-[11.5px] text-emerald-300/80 space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 text-[11px] font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>COLLEGE VIVA PRECISION ARCHITECTURE</span>
          </div>
          <p>
            Krishi Drishti (कृषि दृष्टि) is an open-source precision agriculture system designed for Indian smallholder farming communities.
          </p>
          <p className="text-emerald-400/70 font-mono text-[10.5px]">
            FastAPI 0.110 • Next.js 16.4 • TensorFlow Lite INT8 • PostGIS 3.4 • Redis 7 • Faster-Whisper
          </p>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-8 text-center text-xs text-emerald-300/60 border-t border-emerald-800/60 relative z-10">
        <span>© 2026 Krishi Drishti. MIT Licensed. Made for Indian Agriculture.</span>
      </footer>
    </section>
  );
}
