"use client";

import React, { useState } from "react";
import { IndianRupee, TrendingUp, BarChart3, ArrowUpRight, Receipt, Calendar } from "lucide-react";
import Button from "../Button";

const COMMODITY_PRICES = [
  { crop: "Tomato (Hybrid)", rate: "₹1,950", unit: "per qtl", trend: "+4.2%", mandi: "Azamgarh Mandi" },
  { crop: "Wheat (HD-2967)", rate: "₹2,380", unit: "per qtl", trend: "+1.8%", mandi: "Varanasi Mandi" },
  { crop: "Potato (Jyoti)", rate: "₹1,120", unit: "per qtl", trend: "+0.4%", mandi: "Mirzapur Mandi" },
  { crop: "Mustard (Pusa)", rate: "₹5,400", unit: "per qtl", trend: "+3.1%", mandi: "Gorakhpur Mandi" },
];

export default function MandiLedgerChapter({
  scrollProgress = 0,
  isMobile = false,
  onTrackerClick,
  t,
}) {
  // Active window for Chapter 7: 85% - 95%
  const inChapter = scrollProgress >= 0.83 && scrollProgress <= 0.96;

  return (
    <section id="mandi" className="min-h-[100dvh] flex flex-col justify-center px-4 sm:px-8 py-24 select-none">
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: 3D Kinetic Departure Board Visual Focus (Desktop) */}
        <div className="lg:col-span-5 hidden lg:flex flex-col items-start justify-center pointer-events-none">
          <div className="p-5 rounded-2xl bg-white/75 backdrop-blur-md border border-slate-200/80 space-y-2 shadow-apple-card max-w-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-800 font-bold block">
                3D Kinetic Departure Tiles
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              Live APMC Agmarknet modal rates &amp; P&amp;L bars
            </p>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-100">
              <span>Sync: Redis In-Memory</span>
              <span className="text-emerald-700 font-semibold">+₹1,22,100 Net Margin</span>
            </div>
          </div>
        </div>

        {/* Right Column: Mandi Ledger Interactive Story Card */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-apple-float max-w-2xl ml-auto">
            
            {/* Header Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold tracking-tight border border-amber-200">
                <Receipt className="w-3.5 h-3.5 text-amber-600" />
                FARM ECONOMICS &amp; P&amp;L
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Agmarknet Live Sync
              </span>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Live Mandi Prices &amp; Farm P&amp;L Ledger
            </h2>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal mt-3">
              Connects to daily APMC Mandi modal commodity rates across Uttar Pradesh and major Indian wholesale markets with Redis caching. Offline-first ledger records seed, fertilizer, diesel, and labor inputs to forecast net harvest profitability.
            </p>

            {/* Departure Board Mandi Commodity Rate Tiles */}
            <div className="grid grid-cols-2 gap-2.5 pt-3">
              {COMMODITY_PRICES.map((item) => (
                <div
                  key={item.crop}
                  className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{item.mandi}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {item.trend}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {item.crop}
                    </span>
                    <strong className="text-sm font-bold font-mono text-emerald-300">
                      {item.rate}
                    </strong>
                  </div>
                </div>
              ))}
            </div>

            {/* P&L Comparative Summary Bar */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Crop P&amp;L Ledger Analysis (10 Acres)</span>
                </div>
                <span className="text-emerald-700 font-bold">+66.2% Net Margin</span>
              </div>

              {/* Expense Breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-mono text-slate-400 block">SEEDS</span>
                  <strong className="text-slate-800 text-xs">₹12,000</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-mono text-slate-400 block">FERTILIZER</span>
                  <strong className="text-slate-800 text-xs">₹24,000</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-mono text-slate-400 block">DIESEL/IRRIG</span>
                  <strong className="text-slate-800 text-xs">₹14,000</strong>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-mono text-slate-400 block">LABOR</span>
                  <strong className="text-slate-800 text-xs">₹12,400</strong>
                </div>
              </div>

              {/* Bottom Line Balance */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-mono text-emerald-800 block">
                    Gross Harvest Revenue: ₹1,84,500
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-500">
                    Total Input Expenses: ₹62,400
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-emerald-700 font-bold block">
                    Net Projected Profit
                  </span>
                  <strong className="text-sm font-bold font-mono text-emerald-900">
                    +₹1,22,100
                  </strong>
                </div>
              </div>
            </div>

            {/* Open Farm Ledger CTA */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-normal">
                Prevents distress sales with real-time modal price discovery
              </div>
              <Button
                onClick={onTrackerClick}
                icon={IndianRupee}
                size="lg"
                className="w-full sm:w-auto px-8 shadow-apple-card bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                Open Farm Ledger
              </Button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
