"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Camera, ArrowRight, Zap, Mic, FlaskConical, MapPin } from "lucide-react";
import Button from "../Button";
import MagneticButton from "../ui/MagneticButton";

/**
 * Animated Count-Up Hook
 * Counts from 0 to target with cubic ease-out for viva demonstration.
 */
function useCountUp(target, duration = 1600, decimals = 0) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease-out: 1 - (1 - p)^3
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(+(ease * target).toFixed(decimals));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setVal(target);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [target, duration, decimals]);

  return val;
}

/**
 * Chapter 1: Hero Section
 * Features:
 * - Masked headline typographic reveal (staggered line reveal with overflow-hidden mask)
 * - Four stat cards with depth parallax and animated count-up
 * - Preserved existing button cluster ("रोग स्कैन" and "Instant Demo Login")
 */
export default function HeroChapter({
  scrollProgress = 0,
  isMobile = false,
  onScanClick,
  onDemoClick,
  user,
  t,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger masked entrance on mount
    const timer = setTimeout(() => setMounted(true), 120);
    return () => clearTimeout(timer);
  }, []);

  // Animated Count-Up values
  const latency = useCountUp(5.8, 1400, 1);
  const modelSize = useCountUp(2.45, 1600, 2);
  const cvAccuracy = useCountUp(99.55, 1800, 2);
  const cropsCount = useCountUp(22, 1200, 0);

  // Parallax offsets for the 4 depth cards (clamped on mobile)
  const parallax1 = isMobile ? 0 : scrollProgress * -25;
  const parallax2 = isMobile ? 0 : scrollProgress * -50;
  const parallax3 = isMobile ? 0 : scrollProgress * -35;
  const parallax4 = isMobile ? 0 : scrollProgress * -60;

  return (
    <section className="min-h-[100dvh] flex flex-col justify-center items-center px-4 sm:px-6 pt-24 pb-16 text-center select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Eyebrow Badge with subtle entrance fade */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-tight shadow-apple-card transition-all duration-700 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Edge AI &amp; Multimodal Agriculture Operating System</span>
        </div>

        {/* Masked Headline Reveal: Each line wrapped in an overflow-hidden mask */}
        <div className="overflow-hidden">
          <h1 className="max-w-5xl mx-auto tracking-tight leading-[1.15]">
            <span className="block overflow-hidden py-1">
              <span
                className={`inline-block text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mounted ? "translate-y-0" : "translate-y-full"
                }`}
              >
                Krishi Drishti
              </span>
            </span>
            <span className="block overflow-hidden py-1">
              <span
                className={`inline-block text-lg sm:text-2xl md:text-3xl font-medium text-slate-700 leading-snug max-w-3xl mx-auto transition-transform duration-1000 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  mounted ? "translate-y-0" : "translate-y-full"
                }`}
              >
                An Integrated Decision Support System for Crop Health and Farmer Advisory
              </span>
            </span>
          </h1>
        </div>

        {/* Concise Value Proposition */}
        <p
          className={`text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal transition-all duration-1000 delay-300 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          End-to-end multimodal intelligence: sub-10ms edge pathology, bilingual voice advisory, and micrometeorological spray forecasting.
        </p>

        {/* CTA Button Cluster */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <MagneticButton>
            <Button
              onClick={onScanClick}
              icon={Camera}
              size="lg"
              className="w-full sm:w-auto px-8 text-base shadow-apple-card cursor-pointer"
            >
              {t("scan_tile")}
            </Button>
          </MagneticButton>

          {!user && (
            <MagneticButton>
              <button
                type="button"
                onClick={onDemoClick}
                className="w-full sm:w-auto h-14 px-7 bg-white text-slate-800 border border-slate-200/90 font-bold rounded-btn hover:bg-slate-50 active:scale-[0.96] transition-all duration-150 ease-spring shadow-apple-card flex items-center justify-center gap-2 text-[15px] cursor-pointer"
              >
                <span>Instant Demo Login</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </MagneticButton>
          )}
        </div>

        {/* Four Depth Parallax Metric Cards with Animated Count-Up */}
        <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
          
          {/* Card 1: 5.8ms Latency / 2.45 MB */}
          <div
            style={{ transform: `translateY(${parallax1}px)` }}
            className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-apple-card transition-transform duration-75 ease-out"
          >
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-1">
              <Zap className="w-4 h-4" />
              <span>{latency}ms Latency</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {modelSize} MB
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">MobileNetV2 INT8 Edge</p>
          </div>

          {/* Card 2: Bilingual Voice / Hindi + EN */}
          <div
            style={{ transform: `translateY(${parallax2}px)` }}
            className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-apple-card transition-transform duration-75 ease-out"
          >
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold mb-1">
              <Mic className="w-4 h-4" />
              <span>Bilingual Voice</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              Hindi + EN
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">Faster-Whisper + Gemini</p>
          </div>

          {/* Card 3: 99.55% CV / 22 Crops */}
          <div
            style={{ transform: `translateY(${parallax3}px)` }}
            className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-apple-card transition-transform duration-75 ease-out"
          >
            <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-1">
              <FlaskConical className="w-4 h-4" />
              <span>{cvAccuracy}% CV</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              {cropsCount} Crops
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">Soil NPK Random Forest</p>
          </div>

          {/* Card 4: Spatial GIS / PostGIS */}
          <div
            style={{ transform: `translateY(${parallax4}px)` }}
            className="p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-apple-card transition-transform duration-75 ease-out"
          >
            <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-1">
              <MapPin className="w-4 h-4" />
              <span>Spatial GIS</span>
            </div>
            <div className="text-xl font-black text-slate-900 tracking-tight">
              PostGIS
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">DBSCAN Outbreak Clusters</p>
          </div>

        </div>

      </div>
    </section>
  );
}
