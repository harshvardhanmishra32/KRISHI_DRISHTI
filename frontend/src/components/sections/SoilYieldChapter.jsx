"use client";

import React, { useState } from "react";
import { FlaskConical, Layers, TrendingUp, CheckCircle2, Sparkles, Wheat } from "lucide-react";
import Button from "../Button";

const CROP_MATCHES = [
  { name: "Wheat (HD-2967)", match: 98.4, yieldEst: "4.8 t/ha", state: "Uttar Pradesh", primary: true },
  { name: "Mustard (Pusa Bold)", match: 94.1, yieldEst: "2.1 t/ha", state: "Rajasthan", primary: false },
  { name: "Chickpea (Desi)", match: 91.6, yieldEst: "1.9 t/ha", state: "Madhya Pradesh", primary: false },
  { name: "Sugarcane (Co-0238)", match: 89.2, yieldEst: "78 t/ha", state: "Maharashtra", primary: false },
];

export default function SoilYieldChapter({
  scrollProgress = 0,
  isMobile = false,
  onSoilClick,
  t,
}) {
  const [activeCrop, setActiveCrop] = useState(CROP_MATCHES[0]);

  // Active window for Chapter 5: 57% - 71%
  const inChapter = scrollProgress >= 0.55 && scrollProgress <= 0.73;

  return (
    <section id="soil" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: 3D Stratified Soil Cutaway Visual Focus (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-start justify-center pointer-events-none">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 space-y-2 shadow-apple-card max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-800 font-bold block">
                3D Soil Sedimentary Strata
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Stratified Nitrogen, Phosphorus &amp; Potassium cutaway
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>pH 6.8 Neutral Loam</span>
              <span className="text-indigo-700 font-semibold">99.55% CV Dual ML</span>
            </div>
          </div>
        </div>

        {/* Right Column: Soil & Yield Engine Interactive Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-apple-float max-w-2xl ml-auto">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-[11px] font-bold tracking-tight border border-indigo-200">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                AGRONOMIC MACHINE LEARNING
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-xs font-mono font-bold border border-indigo-200">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                R² = 0.9704 Regressor
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Soil NPK Recommendation &amp; Historical Yield Regressor
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Dual model pipeline: 5-Fold Stratified Random Forest achieving 99.55% CV accuracy across 22 crops from soil Nitrogen, Phosphorus, Potassium, and pH records, coupled with XGBoost historical yield regression across 30 Indian states.
            </p>

            {/* Benchmark Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-mono block">Dataset</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">19,537 Records</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-mono block">Indian States</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">30 Regions</strong>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-mono block">Crops Profiled</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">22 Target Crops</strong>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl">
                <span className="text-[10px] text-emerald-600 font-mono block">Validation</span>
                <strong className="text-emerald-900 text-xs font-bold font-mono">99.55% CV</strong>
              </div>
            </div>

            {/* Live Soil NPK Nutrient & pH Profile Preview */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  <span>Soil Chemistry &amp; Nutrient Stratum</span>
                </div>
                <span className="text-emerald-700 font-bold">pH 6.8 (Neutral)</span>
              </div>

              {/* Multi-layered NPK indicators */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold block">NITROGEN (N)</span>
                  <strong className="text-slate-800 text-sm">140 kg/ha</strong>
                  <span className="text-[9px] text-slate-500 block">Optimal</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-[10px] font-mono text-amber-700 font-bold block">PHOSPHORUS (P)</span>
                  <strong className="text-slate-800 text-sm">45 kg/ha</strong>
                  <span className="text-[9px] text-slate-500 block">Adequate</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/90">
                  <span className="text-[10px] font-mono text-orange-700 font-bold block">POTASSIUM (K)</span>
                  <strong className="text-slate-800 text-sm">180 kg/ha</strong>
                  <span className="text-[9px] text-slate-500 block">Rich</span>
                </div>
              </div>

              {/* Best Recommended Crop Lift */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    🌾
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {activeCrop.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Region: {activeCrop.state} • Expected Yield: {activeCrop.yieldEst}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                  {activeCrop.match}% Match
                </span>
              </div>
            </div>

            {/* Test Soil Health CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-normal">
                Generates actionable NPK dosing without over-fertilization
              </div>
              <Button
                onClick={onSoilClick}
                icon={FlaskConical}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card bg-indigo-700 hover:bg-indigo-800 text-white cursor-pointer"
              >
                Test Soil Health
              </Button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
