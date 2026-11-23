"use client";

import React, { useState, useEffect } from "react";
import { Camera, ShieldCheck, Cpu, ArrowRight } from "lucide-react";
import Button from "../Button";

const DISEASE_CHIPS = [
  "Tomato Early Blight",
  "Bacterial Spot",
  "Leaf Mold",
  "Yellow Leaf Curl (TYLCV)",
  "Potato Late Blight",
  "Spider Mites",
];

export default function LeafScannerChapter({
  scrollProgress = 0,
  isMobile = false,
  onScanClick,
  t,
}) {
  const [meterValue, setMeterValue] = useState(0);

  // Animate the confidence meter when scrolling into Leaf Scanner chapter (12% - 28%)
  const inChapter = scrollProgress >= 0.10 && scrollProgress <= 0.27;

  useEffect(() => {
    if (inChapter) {
      const timer = setTimeout(() => {
        setMeterValue(93.27);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setMeterValue(0);
    }
  }, [inChapter]);

  return (
    <section id="scanner" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Pinned Pathology Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-apple-card max-w-xl">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-tight border border-emerald-200">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                SUB-10MS EDGE PATHOLOGY
              </span>
              <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-lg">
                93.27% Accuracy
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              MobileNetV2 INT8 Quantized Leaf Pathology
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Trained on 20,298 audited leaf images with byte deduplication. Quantized down to 2.45 MB for instantaneous CPU inference directly in the field without cloud latency or GPU overhead.
            </p>

            {/* 6 Disease Chips that fly in and settle */}
            <div className="pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 font-mono">
                Audited Edge Pathology Classes
              </p>
              <div className="flex flex-wrap gap-2">
                {DISEASE_CHIPS.map((chip, idx) => (
                  <span
                    key={chip}
                    style={{
                      transitionDelay: `${idx * 60}ms`,
                      transform: inChapter ? "translateY(0) scale(1)" : "translateY(12px) scale(0.92)",
                      opacity: inChapter ? 1 : 0.4,
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium disease-chip-polish shadow-2xs cursor-default"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            {/* 70% Confidence Safety Gate Meter */}
            <div className="pt-6 border-t border-slate-100 mt-6">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700 mb-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Automatic 70% Confidence Safety Gate</span>
                </div>
                <span className="font-bold text-emerald-700">{meterValue}%</span>
              </div>

              {/* Progress Track */}
              <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                {/* 70% Safety Threshold Line */}
                <div
                  className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-500 z-10"
                  title="70% Safety Threshold"
                />
                {/* Active Progress Fill */}
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-[#7EE0B0] transition-all duration-1000 ease-out"
                  style={{ width: `${meterValue}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0% Input</span>
                <span className="text-amber-600 font-semibold">70% Gate</span>
                <span>100% Certainty</span>
              </div>
            </div>

            {/* Launch Scanner Action */}
            <div className="pt-6">
              <Button
                onClick={onScanClick}
                icon={Camera}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card cursor-pointer"
              >
                Launch Scanner
              </Button>
            </div>

          </div>
        </div>

        {/* Right Column: Space reserved for 3D Neural Leaf inspection focus */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-end justify-center pointer-events-none">
          <div className="p-4 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 text-right space-y-1 shadow-apple-card">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-700 font-bold block">
              ● 3D Diagnostic Telemetry
            </span>
            <p className="text-xs font-semibold text-slate-800">
              Camera tracking leaf surface geometry
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              INT8 quantized kernel: 2.45 MB
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
