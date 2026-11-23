"use client";

import React, { useState, useEffect } from "react";
import { Mic, Volume2, Sparkles, Radio, ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";
import Button from "../Button";

const MULTILINGUAL_TOKENS = [
  { hi: "मंडी भाव", en: "Mandi Rates" },
  { hi: "मौसम पूर्वानुमान", en: "Weather Radar" },
  { hi: "कीट नियंत्रण", en: "Pest Defense" },
  { hi: "यूरिया गणना", en: "NPK Dosage" },
  { hi: "फसल बीमा", en: "PM Fasal Bima" },
];

export default function VoiceEngineChapter({
  scrollProgress = 0,
  isMobile = false,
  onVoiceClick,
  t,
}) {
  // Active window for Chapter 3: 25% - 42%
  const inChapter = scrollProgress >= 0.25 && scrollProgress <= 0.42;

  return (
    <section id="voice" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: 3D Acoustic WaveRing Visual Focus (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-start justify-center pointer-events-none">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 space-y-2 shadow-apple-card max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-700 font-bold block">
                3D Acoustic Harmonic WaveRing
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Real-time speech resonance modulation
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>First-Token: 142ms</span>
              <span className="text-blue-600 font-semibold">16kHz Opus Stream</span>
            </div>
          </div>
        </div>

        {/* Right Column: Conversational Speech Engine Interactive Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-apple-float max-w-2xl ml-auto">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold tracking-tight border border-blue-200">
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                VOICE FIRST TELEPHONY
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Zero Syllable Looping
                </span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Conversational Speech Engine
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Integrated Faster-Whisper ASR with Devanagari Hindi prompt biasing. Fast NLU answers mandi rates and spray advisories in regional dialects with zero syllable stutter, delegating agronomic diagnosis to Gemini 3.1.
            </p>

            {/* Realistic Bilingual Conversational Chat Simulation */}
            <div className="mt-5 space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50/90 border border-slate-200/80">
              
              {/* Farmer Inbound Audio Bubble */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs font-bold text-xs">
                  👨‍🌾
                </div>
                <div className="flex-1 bg-white p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-500 font-mono">
                      Farmer • Voice Query (आजमगढ़, UP)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Audio 1.8s
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    &quot;भैया, आज आज़मगढ़ मंडी में टमाटर का क्या भाव है?&quot;
                  </p>
                </div>
              </div>

              {/* Krishi Drishti Synthesized Voice Response */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 bg-gradient-to-br from-emerald-50/80 to-blue-50/50 p-3.5 rounded-2xl rounded-tl-sm border border-emerald-200/80 shadow-2xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-emerald-800 font-mono flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                      Krishi Drishti Assistant
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded font-bold">
                      142ms TTS
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    &quot;आज आज़मगढ़ मंडी में हाइब्रिड टमाटर ₹1,850 - ₹2,100 प्रति क्विंटल चल रहा है। आवक सामान्य है।&quot;
                  </p>
                </div>
              </div>

            </div>

            {/* Drifting Multilingual Hindi/English Word Tokens */}
            <div className="pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
                Real-Time Dialect Acoustic Tokens
              </p>
              <div className="flex flex-wrap gap-2">
                {MULTILINGUAL_TOKENS.map((token, idx) => (
                  <span
                    key={token.en}
                    style={{
                      transitionDelay: `${idx * 75}ms`,
                      transform: inChapter ? "translateY(0) scale(1)" : "translateY(10px) scale(0.94)",
                      opacity: inChapter ? 1 : 0.45,
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-50/80 text-blue-900 border border-blue-200/80 text-xs font-medium disease-chip-polish shadow-2xs flex items-center gap-1.5 cursor-default"
                  >
                    <span className="font-semibold">{token.hi}</span>
                    <span className="text-[10px] text-blue-600/80 font-mono">({token.en})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Try Voice Assistant Action */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-normal">
                Hands-free agronomy telephony for 22 crops in regional Indian languages
              </div>
              <Button
                onClick={onVoiceClick}
                icon={Mic}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Try Voice Assistant
              </Button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
