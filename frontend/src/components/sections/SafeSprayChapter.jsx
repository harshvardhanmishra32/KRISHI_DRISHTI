"use client";

import React, { useState } from "react";
import { CloudSun, Wind, Droplets, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import Button from "../Button";

// 48 synthetic hourly data points matching our 3D column simulation
const HOURLY_TIMELINE = Array.from({ length: 48 }, (_, i) => {
  const hour = i % 24;
  const wind = 6 + Math.sin(i * 0.35) * 8 + Math.cos(i * 0.15) * 5;
  const rain = (Math.sin(i * 0.45 + 1.2) + 1) * 25;
  const isSafe = wind < 15 && rain < 20;
  return {
    hourLabel: `${hour.toString().padStart(2, "0")}:00`,
    wind: wind.toFixed(1),
    rain: rain.toFixed(0),
    isSafe,
  };
});

export default function SafeSprayChapter({
  scrollProgress = 0,
  isMobile = false,
  onWeatherClick,
  t,
}) {
  const [selectedHour, setSelectedHour] = useState(HOURLY_TIMELINE[3]);

  // Active window for Chapter 4: 42% - 57%
  const inChapter = scrollProgress >= 0.40 && scrollProgress <= 0.58;

  return (
    <section id="spray" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: 3D Meteorological Column Visual Focus (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-start justify-center pointer-events-none">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 space-y-2 shadow-apple-card max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-800 font-bold block">
                3D Meteorological Geometry
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              48 hourly pillars height-mapped to wind speed &amp; rain risk
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>Target: 06:00 - 09:00 AM</span>
              <span className="text-emerald-700 font-semibold">Optimal Spray Window</span>
            </div>
          </div>
        </div>

        {/* Right Column: Safe Spray Engine Interactive Story Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-apple-float max-w-2xl ml-auto">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold tracking-tight border border-amber-200">
                <Wind className="w-3.5 h-3.5 text-amber-600" />
                MICROMETEOROLOGY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Optimal Slot Identified
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              48-Hour Safe Spray Engine
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Evaluates hourly wind velocity (&lt;15 km/h limit), rain probabilities (&lt;20%), and humidity to predict fungal disease outbreak risk and avert toxic chemical wash-off.
            </p>

            {/* Micro-climate Parameter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <Wind className="w-3.5 h-3.5 text-slate-400" />
                  <span>Wind Speed</span>
                </div>
                <strong className="text-slate-900 text-sm font-bold font-mono">
                  {selectedHour.wind} km/h
                </strong>
                <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5 font-mono">
                  &lt; 15 km/h Limit Safe
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium mb-1">
                  <Droplets className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rain Probability</span>
                </div>
                <strong className="text-slate-900 text-sm font-bold font-mono">
                  {selectedHour.rain}%
                </strong>
                <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5 font-mono">
                  &lt; 20% Wash-off Gate
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-medium mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Forecast Hour</span>
                </div>
                <strong className="text-emerald-900 text-sm font-bold font-mono">
                  {selectedHour.hourLabel}
                </strong>
                <span className="block text-[10px] text-emerald-700 font-semibold mt-0.5 font-mono">
                  {selectedHour.isSafe ? "✓ Recommended" : "⚠️ High Drift"}
                </span>
              </div>
            </div>

            {/* Interactive 48-Hour Micro-Timeline Strip */}
            <div className="pt-4">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-2">
                <span>48-Hour Hourly Timeline Matrix</span>
                <span className="text-emerald-700 font-semibold">Green = Safe • Amber = Risky</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
                {HOURLY_TIMELINE.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedHour(item)}
                    title={`${item.hourLabel}: Wind ${item.wind} km/h, Rain ${item.rain}% (${item.isSafe ? "Safe" : "Risky"})`}
                    className={`h-7 w-2 sm:w-2.5 rounded-full transition-all cursor-pointer ${
                      item.isSafe
                        ? selectedHour === item
                          ? "bg-emerald-600 scale-y-125 shadow-2xs ring-2 ring-emerald-300"
                          : "bg-emerald-400/80 hover:bg-emerald-500"
                        : selectedHour === item
                        ? "bg-amber-600 scale-y-125 shadow-2xs ring-2 ring-amber-300"
                        : "bg-amber-400/70 hover:bg-amber-500"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Check Spray Window CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-normal">
                Prevents chemical wash-off and groundwater contamination
              </div>
              <Button
                onClick={onWeatherClick}
                icon={CloudSun}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
              >
                Check Spray Window
              </Button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
