"use client";

import React from "react";
import { MapPin, Radio, ShieldAlert, Users, BellRing, ArrowRight } from "lucide-react";
import Button from "../Button";

const OUTBREAK_CLUSTERS = [
  { region: "Azamgarh Sector 4", pathogen: "Tomato Early Blight", farms: 16, status: "Critical Outbreak", risk: "high" },
  { region: "Varanasi North", pathogen: "Bacterial Spot", farms: 12, status: "Active Cluster", risk: "medium" },
  { region: "Mirzapur Block", pathogen: "Leaf Mold", farms: 8, status: "Contained", risk: "low" },
];

export default function SpatialOutbreaksChapter({
  scrollProgress = 0,
  isMobile = false,
  onOutbreakClick,
  t,
}) {
  // Active window for Chapter 6: 71% - 85%
  const inChapter = scrollProgress >= 0.69 && scrollProgress <= 0.86;

  return (
    <section id="outbreaks" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: 3D Topographical Relief Map Visual Focus (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-start justify-center pointer-events-none">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 space-y-2 shadow-apple-card max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-red-700 font-bold block">
                PostGIS ST_DWithin Telemetry
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Uttar Pradesh regional cluster beacons &amp; alert vectors
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>Radius: 25,000m (25 km)</span>
              <span className="text-emerald-700 font-semibold">GEOGRAPHY(Point, 4326)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Spatial Outbreaks Interactive Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-apple-float max-w-2xl ml-auto">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-tight border border-emerald-200">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                SPATIAL TELEMETRY
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-mono font-bold border border-red-200">
                <Radio className="w-3.5 h-3.5 text-red-600 animate-pulse" />
                25km DBSCAN Containment
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              PostGIS Spatial Disease Clustering
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Farm holdings are geocoded with spatial geometry (<code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">GEOGRAPHY(Point, 4326)</code>). When confirmed fungal or viral outbreaks occur, spatial radius queries and DBSCAN clustering automatically generate early warning alerts for neighboring farms and KVK agronomists.
            </p>

            {/* Benchmark Spatial Telemetry Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-mono block">Query Function</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">ST_DWithin()</strong>
                <span className="text-[10px] text-slate-400 block font-mono">25,000m Metric</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="text-[10px] text-slate-500 font-mono block">Active Clusters</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">12 Geofenced Zones</strong>
                <span className="text-[10px] text-slate-400 block font-mono">DBSCAN Epsilon 0.25</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 font-mono block">Advisory Channel</span>
                <strong className="text-slate-900 text-xs font-bold font-mono">KVK Agronomist</strong>
                <span className="text-[10px] text-emerald-700 block font-mono font-semibold">SMS + WhatsApp</span>
              </div>
            </div>

            {/* Active Epidemic Vector Mini-Feed */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-red-600" />
                  <span>Real-Time Geofenced Outbreak Clusters</span>
                </div>
                <span className="text-red-600 font-bold">12 Clusters Active</span>
              </div>

              <div className="space-y-2">
                {OUTBREAK_CLUSTERS.map((cl) => (
                  <div
                    key={cl.region}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          cl.risk === "high"
                            ? "bg-red-500 animate-ping"
                            : cl.risk === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">
                          {cl.region}
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          {cl.pathogen} • {cl.farms} Holdings Notified
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        cl.risk === "high"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : cl.risk === "medium"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {cl.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Outbreak Map CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-normal">
                Sub-kilometer spatial containment protects contiguous harvests
              </div>
              <Button
                onClick={onOutbreakClick}
                icon={MapPin}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer"
              >
                View Outbreak Map
              </Button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
