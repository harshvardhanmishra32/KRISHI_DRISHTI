"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
  ChevronRight,
  Zap,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/Button";
import CinematicNav from "../components/ui/CinematicNav";
import ScrollProgress from "../components/ui/ScrollProgress";
import SproutLoader from "../components/ui/SproutLoader";
import FieldTelemetry from "../components/ui/FieldTelemetry";
import ScannerLensCursor from "../components/ui/ScannerLensCursor";
import PageTransitionWipe from "../components/ui/PageTransitionWipe";
import HeroChapter from "../components/sections/HeroChapter";
import LeafScannerChapter from "../components/sections/LeafScannerChapter";
import VoiceEngineChapter from "../components/sections/VoiceEngineChapter";
import SafeSprayChapter from "../components/sections/SafeSprayChapter";
import SoilYieldChapter from "../components/sections/SoilYieldChapter";
import SpatialOutbreaksChapter from "../components/sections/SpatialOutbreaksChapter";
import MandiLedgerChapter from "../components/sections/MandiLedgerChapter";
import FinalCTAChapter from "../components/sections/FinalCTAChapter";
import { hapticLight, hapticSuccess } from "../lib/haptics";

// Dynamically import 3D Scene with SSR disabled for Next.js App Router safety
const Scene = dynamic(() => import("../components/three/Scene"), {
  ssr: false,
});

export default function CinematicLandingPage() {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const { t } = useLanguage();

  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const lenisRef = useRef(null);

  // 1. Detect screen size and accessibility preferences
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Support deterministic preview scrolling via ?scroll=PERCENT query param
    const params = new URLSearchParams(window.location.search);
    const scrollParam = params.get("scroll");
    if (scrollParam) {
      const pct = parseFloat(scrollParam) / 100;
      setTimeout(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: maxScroll * pct, behavior: "instant" });
      }, 400);
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 2. Initialize Lenis + GSAP ScrollTrigger Synchronization
  useEffect(() => {
    let gsapInstance;
    let ScrollTriggerInstance;
    let lenisInstance;

    const setupSmoothScroll = async () => {
      // Respect user's reduced motion preference
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      const gsapModule = await import("gsap");
      const scrollTriggerModule = await import("gsap/ScrollTrigger");
      const LenisModule = await import("lenis");

      gsapInstance = gsapModule.gsap || gsapModule.default;
      ScrollTriggerInstance =
        scrollTriggerModule.ScrollTrigger || scrollTriggerModule.default;
      const Lenis = LenisModule.default || LenisModule;

      gsapInstance.registerPlugin(ScrollTriggerInstance);

      if (!prefersReducedMotion) {
        lenisInstance = new Lenis({
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
          touchMultiplier: 1.5,
        });

        lenisRef.current = lenisInstance;

        // Synchronize Lenis scroll ticker with GSAP ScrollTrigger
        lenisInstance.on("scroll", ScrollTriggerInstance.update);

        gsapInstance.ticker.add((time) => {
          lenisInstance.raf(time * 1000);
        });

        gsapInstance.ticker.lagSmoothing(0);
      }

      // Master scroll progress tracker over the entire document
      if (containerRef.current) {
        ScrollTriggerInstance.create({
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            setScrollProgress(self.progress);
          },
        });
      }
    };

    setupSmoothScroll();

    return () => {
      if (lenisInstance) {
        lenisInstance.destroy();
      }
      if (ScrollTriggerInstance) {
        ScrollTriggerInstance.getAll().forEach((trigger) => trigger.kill());
      }
    };
  }, []);

  // Smooth scroll to chapter percentage
  const handleScrollToProgress = (targetProgress) => {
    if (lenisRef.current && containerRef.current) {
      const totalScroll =
        containerRef.current.scrollHeight - window.innerHeight;
      lenisRef.current.scrollTo(totalScroll * targetProgress, {
        duration: 1.4,
      });
    } else {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({
        top: totalScroll * targetProgress,
        behavior: "smooth",
      });
    }
  };

  const navigateTo = (route) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("krishi:navigate-start"));
    }
    setTimeout(() => {
      router.push(route);
    }, 250);
  };

  const handleScanClick = () => {
    hapticLight();
    navigateTo(user ? "/scan" : "/login?redirect=/scan");
  };

  const handleVoiceClick = () => {
    hapticLight();
    navigateTo(user ? "/voice" : "/login?redirect=/voice");
  };

  const handleWeatherClick = () => {
    hapticLight();
    navigateTo("/weather");
  };

  const handleSoilClick = () => {
    hapticLight();
    navigateTo(user ? "/soil" : "/login?redirect=/soil");
  };

  const handleOutbreakClick = () => {
    hapticLight();
    navigateTo(user ? "/outbreaks" : "/login?redirect=/outbreaks");
  };

  const handleTrackerClick = () => {
    hapticLight();
    navigateTo(user ? "/tracker" : "/login?redirect=/tracker");
  };

  const handleSignupClick = () => {
    hapticLight();
    navigateTo("/signup");
  };

  const handleDemoClick = async () => {
    hapticSuccess();
    try {
      await demoLogin();
      navigateTo("/dashboard");
    } catch {
      navigateTo("/login");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-[#F8FAFC] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden"
    >
      {/* Studio Scanner-Lens Cursor */}
      <ScannerLensCursor />

      {/* Page Transition Sprout Wipe */}
      <PageTransitionWipe />

      {/* Asset Preloader */}
      <SproutLoader />

      {/* Persistent 3D WebGL Canvas (Fixed in background) */}
      <Scene scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* Floating HUD Controls */}
      <ScrollProgress progress={scrollProgress} onScrollTo={handleScrollToProgress} />
      <CinematicNav onScrollTo={handleScrollToProgress} progress={scrollProgress} />
      <FieldTelemetry />

      {/* Tactile Studio Micro-Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 grain-overlay opacity-60" />

      {/* Foreground Interactive DOM Story Chapters (Positioned above 3D canvas) */}
      <div className="relative z-10 w-full pointer-events-auto">
        
        {/* ========================================================================= */}
        {/* CHAPTER 1: HERO (0% - 12%)                                                */}
        {/* ========================================================================= */}
        <HeroChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onScanClick={handleScanClick}
          onDemoClick={handleDemoClick}
          user={user}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 2: LEAF SCANNER & EDGE PATHOLOGY (12% - 40%)                     */}
        {/* ========================================================================= */}
        <LeafScannerChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onScanClick={handleScanClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 3: BILINGUAL CONVERSATIONAL VOICE ASSISTANT (40% - 55%)           */}
        {/* ========================================================================= */}
        <VoiceEngineChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onVoiceClick={handleVoiceClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 4: 48-HOUR SAFE SPRAY WINDOW (42% - 57%)                          */}
        {/* ========================================================================= */}
        <SafeSprayChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onWeatherClick={handleWeatherClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 5: SOIL NPK & CROP YIELD (57% - 71%)                              */}
        {/* ========================================================================= */}
        <SoilYieldChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onSoilClick={handleSoilClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 6: POSTGIS SPATIAL OUTBREAKS (71% - 85%)                          */}
        {/* ========================================================================= */}
        <SpatialOutbreaksChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onOutbreakClick={handleOutbreakClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 7: MANDI LEDGER & ECONOMICS (85% - 95%)                           */}
        {/* ========================================================================= */}
        <MandiLedgerChapter
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          onTrackerClick={handleTrackerClick}
          t={t}
        />

        {/* ========================================================================= */}
        {/* CHAPTER 8: FINAL CTA & SYSTEM FOOTER (95% - 100%)                         */}
        {/* ========================================================================= */}
        <FinalCTAChapter
          onDemoClick={handleDemoClick}
          onSignupClick={handleSignupClick}
          user={user}
          t={t}
        />

      </div>
    </div>
  );
}
