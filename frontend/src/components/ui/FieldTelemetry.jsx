"use client";

import React, { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Radio } from "lucide-react";

/**
 * Editorial Agritech Telemetry Beacon:
 * Real-time sensory readout anchoring the 3D world in authentic precision agriculture data.
 * Safe margin: minimum 16px from viewport edges.
 * Responsive: Collapsible compact pill on mobile, expandable on tap.
 */
export default function FieldTelemetry() {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [timeStr, setTimeStr] = useState("06:30:00 IST");
  const [reading, setReading] = useState({
    temp: 26.4,
    humidity: 68,
    wind: 7.2,
    ndvi: 0.84,
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " IST"
      );
      // Subtle organic jitter simulating live sensor telemetry
      setReading({
        temp: +(26.0 + Math.sin(Date.now() * 0.001) * 0.5).toFixed(1),
        humidity: +(68 + Math.cos(Date.now() * 0.001) * 1.5).toFixed(0),
        wind: +(7.0 + Math.sin(Date.now() * 0.002) * 0.8).toFixed(1),
        ndvi: +(0.84 + Math.sin(Date.now() * 0.0005) * 0.02).toFixed(2),
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <aside
      aria-label="Live Agritech Field Telemetry"
      className="fixed bottom-16 sm:bottom-6 left-4 sm:left-6 lg:left-8 z-40 select-none max-w-[calc(100vw-32px)] sm:max-w-sm pointer-events-auto"
      style={{
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Mobile Collapsed State: Compact Pill */}
      {isMobile && collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-md shadow-emerald-950/10 rounded-full px-3.5 py-2 flex items-center gap-2 transition-all active:scale-95 text-slate-800"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] font-bold tracking-wider uppercase text-emerald-800">
            Beacon {reading.temp}°C
          </span>
          <ChevronUp className="w-3 h-3 text-slate-400 ml-1" />
        </button>
      ) : (
        /* Full Telemetry Card (Desktop & Expanded Mobile) */
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg shadow-emerald-950/8 rounded-2xl p-3.5 transition-all duration-300">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-800 tracking-wider uppercase">
                Field Telemetry Beacon
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-slate-400 tracking-tight">
                {timeStr}
              </span>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-md hover:bg-slate-100"
                title={collapsed ? "Expand Telemetry" : "Collapse Telemetry"}
                aria-label={collapsed ? "Expand Telemetry" : "Collapse Telemetry"}
              >
                {collapsed ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {!collapsed && (
            <div className="grid grid-cols-2 gap-2.5 pt-2.5 font-mono text-[11px]">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  Micro-Climate
                </span>
                <span className="font-semibold text-slate-800">
                  {reading.temp}°C · {reading.humidity}% RH
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  Wind Velocity
                </span>
                <span className="font-semibold text-emerald-700">
                  {reading.wind} km/h (Safe Spray)
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  Spectral NDVI
                </span>
                <span className="font-semibold text-slate-800">
                  {reading.ndvi} · Optimal Canopy
                </span>
              </div>

              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-slate-400">
                  Edge Inference
                </span>
                <span className="font-semibold text-slate-800">
                  5.8ms · MobileNet INT8
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
