"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Sprout,
  Camera,
  CloudSun,
  FlaskConical,
  IndianRupee,
  Mic,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Droplets,
  Wind,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Button from "../../components/Button";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { hapticLight, hapticSuccess } from "../../lib/haptics";

export default function LandingPage() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const { t } = useLanguage();

  const handleScanClick = () => {
    hapticLight();
    if (user) {
      router.push("/scan");
    } else {
      router.push("/login?redirect=/scan");
    }
  };

  const handleDemoClick = async () => {
    hapticSuccess();
    try {
      await demoLogin();
      router.push("/dashboard");
    } catch {
      router.push("/login");
    }
  };

  return (
    <main className="overflow-x-hidden w-full max-w-full bg-[#F8FAFC] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 min-h-screen flex flex-col justify-between">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 glass-header border-b border-slate-200/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-krishi-light/90 border border-krishi-green/20 flex items-center justify-center text-krishi-green shadow-xs">
              <Sprout className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-none">
                Krishi Drishti
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 tracking-tight">
                कृषि दृष्टि • Precision Agritech
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#features" className="hover:text-krishi-green transition-colors">
              Platform Features
            </a>
            <a href="#models" className="hover:text-krishi-green transition-colors">
              Edge AI Models
            </a>
            <a href="#spatial" className="hover:text-krishi-green transition-colors">
              Spatial Outbreaks
            </a>
            <a href="#mandi" className="hover:text-krishi-green transition-colors">
              Mandi Ledger
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {user ? (
              <Button
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="hidden sm:inline-flex w-auto px-4"
              >
                {t("nav_home")}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDemoClick}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl transition-all active:scale-95 shadow-2xs cursor-pointer"
                >
                  Explore Demo
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="hidden sm:inline-flex px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
                >
                  {t("login")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. ATTENTION (HERO SECTION) */}
      <section className="pt-12 sm:pt-20 pb-16 px-4 sm:px-6 relative">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold tracking-tight shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Edge AI & Multimodal Agriculture Operating System</span>
          </div>

          {/* 2-Line Iron Rule Headline */}
          <h1 className="tracking-tight leading-tight max-w-5xl mx-auto">
            <span className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 block mb-2">
              Krishi Drishti
            </span>
            <span className="text-lg sm:text-2xl lg:text-3xl font-medium text-slate-700 block max-w-3xl mx-auto leading-snug">
              An Integrated Decision Support System for Crop Health and Farmer Advisory
            </span>
          </h1>

          {/* Subtext (Under 20 Words) */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            End-to-end multimodal intelligence: sub-10ms edge pathology, bilingual voice advisory, and micrometeorological spray forecasting.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 max-w-md mx-auto">
            <Button
              onClick={handleScanClick}
              icon={Camera}
              size="lg"
              className="w-full sm:w-auto px-8 text-base shadow-apple-card"
            >
              {t("scan_tile")}
            </Button>

            {!user && (
              <button
                type="button"
                onClick={handleDemoClick}
                className="w-full sm:w-auto h-14 px-7 bg-white text-slate-800 border border-slate-200/90 font-bold rounded-btn hover:bg-slate-50 active:scale-[0.96] transition-all duration-150 ease-spring shadow-apple-card flex items-center justify-center gap-2 text-[15px]"
              >
                <span>Instant Demo Login</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            )}
          </div>

          {/* Architectural Metrics Ribbon */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-apple-card">
              <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-1">
                <Zap className="w-4 h-4" />
                <span>5.8ms Latency</span>
              </div>
              <div className="text-xl font-black text-slate-900">2.45 MB</div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">MobileNetV2 INT8 Edge</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-apple-card">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold mb-1">
                <Mic className="w-4 h-4" />
                <span>Bilingual Voice</span>
              </div>
              <div className="text-xl font-black text-slate-900">Hindi + EN</div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">Faster-Whisper + Gemini</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-apple-card">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold mb-1">
                <FlaskConical className="w-4 h-4" />
                <span>99.55% CV</span>
              </div>
              <div className="text-xl font-black text-slate-900">22 Crops</div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">Soil NPK Random Forest</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-apple-card">
              <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-1">
                <MapPin className="w-4 h-4" />
                <span>Spatial GIS</span>
              </div>
              <div className="text-xl font-black text-slate-900">PostGIS</div>
              <p className="text-[11.5px] text-slate-500 mt-0.5">DBSCAN Outbreak Clusters</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. INTEREST (GAPLESS BENTO GRID) */}
      <section id="features" className="py-16 px-4 sm:px-6 bg-slate-100/60 border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Precision Intelligence Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Purpose-built machine learning and spatial telemetry engineered for zero-latency offline farm utility.
            </p>
          </div>

          {/* Mathematical Gapless Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 grid-flow-dense">
            
            {/* Bento Tile 1: Edge Pathology Detection (2 cols) */}
            <div className="md:col-span-2 p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card flex flex-col justify-between hover:shadow-apple-hover transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Sub-10ms Edge Computer Vision
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    93.27% Accuracy
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  MobileNetV2 INT8 Quantized Leaf Pathology
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Trained on 20,298 audited leaf images with byte deduplication. Quantized down to 2.45 MB for instantaneous CPU inference directly in the field without cloud latency or GPU overhead.
                </p>

                {/* Disease Class Tag Cloud */}
                <div className="pt-2 flex flex-wrap gap-1.5 text-[11px]">
                  {["Tomato Early Blight", "Bacterial Spot", "Leaf Mold", "Yellow Leaf Curl (TYLCV)", "Potato Late Blight", "Spider Mites"].map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-700 border border-slate-200/80 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Automatic 70% Confidence Safety Gate</span>
                <button
                  type="button"
                  onClick={handleScanClick}
                  className="font-bold text-krishi-green hover:underline flex items-center gap-1 active:scale-95"
                >
                  <span>Launch Scanner</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bento Tile 2: Bilingual Conversational Voice Assistant (1 col) */}
            <div className="p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card flex flex-col justify-between hover:shadow-apple-hover transition-all duration-200">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  Voice First Telephony
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Conversational Speech Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Integrated Faster-Whisper ASR with Devanagari Hindi prompt biasing. Fast NLU answers mandi rates and weather instantly, delegating agronomic diagnosis to Gemini 3.1.
                </p>
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-blue-900 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span>Zero Syllable Looping</span>
                  </div>
                  <p className="text-[11px] text-blue-700">Native Hindi & English audio synthesis</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => router.push(user ? "/voice" : "/login?redirect=/voice")}
                  className="w-full py-2.5 bg-blue-50 hover:bg-blue-100/70 text-blue-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Try Voice Assistant</span>
                </button>
              </div>
            </div>

            {/* Bento Tile 3: 48h Safe Spray Window Engine (1 col) */}
            <div className="p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card flex flex-col justify-between hover:shadow-apple-hover transition-all duration-200">
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Micrometeorology
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  48-Hour Safe Spray Engine
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Evaluates hourly wind velocity (&lt;15 km/h limit), rain probabilities (&lt;20%), and humidity to predict fungal disease outbreak risk and avert toxic chemical wash-off.
                </p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Wind Limit</span>
                    <strong className="text-slate-800">&lt; 3.0 m/s</strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
                    <span className="text-[10px] text-emerald-600 block">Spray Status</span>
                    <strong>Optimal Slot</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => router.push("/weather")}
                  className="w-full py-2.5 bg-amber-50 hover:bg-amber-100/70 text-amber-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <CloudSun className="w-3.5 h-3.5" />
                  <span>Check Spray Window</span>
                </button>
              </div>
            </div>

            {/* Bento Tile 4: Precision Soil-to-Crop Recommender (2 cols) */}
            <div className="md:col-span-2 p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card flex flex-col justify-between hover:shadow-apple-hover transition-all duration-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                    Agronomic Machine Learning
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                    R² = 0.9704 Regressor
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Soil NPK Recommendation & Historical Yield Regressor
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Dual model pipeline: 5-Fold Stratified Random Forest achieving 99.55% CV accuracy across 22 crops from soil Nitrogen, Phosphorus, Potassium, and pH records, coupled with XGBoost historical yield regression across 30 Indian states.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Dataset</span>
                    <strong className="text-slate-800">19,537 Records</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Indian States</span>
                    <strong className="text-slate-800">30 Regions</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-500 block">Crops Profiled</span>
                    <strong className="text-slate-800">55 Varieties</strong>
                  </div>
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl">
                    <span className="text-[10px] text-emerald-600 block">Accuracy</span>
                    <strong className="text-emerald-800">99.55% CV</strong>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Integrated Indian Soil Health Card Support</span>
                <button
                  type="button"
                  onClick={() => router.push(user ? "/soil" : "/login?redirect=/soil")}
                  className="font-bold text-krishi-green hover:underline flex items-center gap-1 active:scale-95"
                >
                  <span>Test Soil Health</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. DESIRE (SPATIAL EPIDEMIOLOGY & MANDI LEDGER) */}
      <section id="spatial" className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Spatial Containment & Farm Economics
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Epidemiological disease outbreak clustering and live mandi arrival market rates.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Feature Card A: PostGIS Spatial Outbreak Tracking */}
            <div className="p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card space-y-4 hover:shadow-apple-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-krishi-green flex items-center justify-center border border-emerald-100">
                <MapPin className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                PostGIS Spatial Disease Clustering
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Farm holdings are geocoded with spatial geometry (`GEOGRAPHY(Point, 4326)`). When confirmed fungal or viral outbreaks occur, spatial radius queries and DBSCAN clustering automatically generate early warning alerts for neighboring farms and KVK agronomists.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(user ? "/outbreaks" : "/login?redirect=/outbreaks")}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-btn hover:bg-slate-800 active:scale-95 transition-all"
                >
                  View Outbreak Map
                </button>
                <span className="text-[11px] text-slate-500 font-mono">DBSCAN Spatial Radius</span>
              </div>
            </div>

            {/* Feature Card B: APMC Mandi Market Prices & Input Cost Ledger */}
            <div id="mandi" className="p-6 rounded-card bg-white border border-slate-200/90 shadow-apple-card space-y-4 hover:shadow-apple-hover transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                <IndianRupee className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Live Mandi Prices & Farm P&amp;L Ledger
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connects to daily APMC Mandi modal commodity rates across Uttar Pradesh and major Indian wholesale markets with Redis caching. Offline-first ledger records seed, fertilizer, diesel, and labor inputs to forecast net harvest profitability.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(user ? "/tracker" : "/login?redirect=/tracker")}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-btn hover:bg-emerald-800 active:scale-95 transition-all"
                >
                  Open Farm Ledger
                </button>
                <span className="text-[11px] text-slate-500 font-mono">Redis 2h Caching</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. ACTION (CONVERSION & ONBOARDING FOOTER) */}
      <section className="py-16 px-4 sm:px-6 bg-emerald-900 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-300">
            <Sprout className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Deploy Precision Agritech to Your Field Today
          </h2>

          <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto font-normal leading-relaxed">
            Instant 1-click evaluation with pre-seeded Uttar Pradesh farms, real-time leaf diagnostic telemetry, and bilingual speech intelligence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 max-w-sm mx-auto">
            <button
              type="button"
              onClick={handleDemoClick}
              className="w-full sm:w-auto h-12 px-7 bg-white text-emerald-950 font-bold rounded-btn hover:bg-slate-100 active:scale-95 transition-all text-sm shadow-md cursor-pointer"
            >
              1-Click Instant Demo
            </button>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="w-full sm:w-auto h-12 px-7 bg-emerald-800 text-white border border-emerald-700 font-bold rounded-btn hover:bg-emerald-700 active:scale-95 transition-all text-sm cursor-pointer"
            >
              Create Account
            </button>
          </div>

          <div className="pt-8 border-t border-emerald-800/80 text-[11.5px] text-emerald-300/80 space-y-2">
            <p>
              Krishi Drishti (कृषि दृष्टि) is an open-source precision agriculture system designed for Indian smallholder farming communities.
            </p>
            <p className="text-emerald-400/60 font-mono text-[10.5px]">
              FastAPI 0.110 • Next.js 16.4 • TensorFlow Lite • PostGIS 3.4 • Redis 7 • Faster-Whisper
            </p>
          </div>

        </div>
      </section>

      {/* 6. SYSTEM FOOTER */}
      <footer className="py-6 px-4 bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>© 2026 Krishi Drishti. MIT Licensed. Made for Indian Agriculture.</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/harshvardhanmishra32/Krishi-Drishti" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub Repository
            </a>
            <button onClick={() => router.push("/login")} className="hover:text-white transition-colors">
              Farmer Login
            </button>
          </div>
        </div>
      </footer>

    </main>
  );
}
