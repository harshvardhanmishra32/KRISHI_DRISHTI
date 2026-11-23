"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sprout, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../LanguageSwitcher";
import Button from "../Button";
import { hapticLight, hapticSuccess } from "../../lib/haptics";
import { toggleFieldAudio } from "../../lib/fieldAudio";

export default function CinematicNav({ onScrollTo, progress = 0 }) {
  const router = useRouter();
  const { user, demoLogin } = useAuth();
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [audioActive, setAudioActive] = useState(false);

  useEffect(() => {
    setScrolled(progress > 0.02);
  }, [progress]);

  const handleDemoClick = async () => {
    hapticSuccess();
    try {
      await demoLogin();
      router.push("/dashboard");
    } catch {
      router.push("/login");
    }
  };

  const navLinks = [
    { label: "Platform Features", target: "scanner", progress: 0.143 },
    { label: "Edge AI Models", target: "voice", progress: 0.286 },
    { label: "Spatial Outbreaks", target: "outbreaks", progress: 0.714 },
    { label: "Mandi Ledger", target: "mandi", progress: 0.857 },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? "py-2.5 glass-header border-b border-slate-200/80 shadow-xs"
          : "py-4 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div
          onClick={() => {
            hapticLight();
            if (onScrollTo) onScrollTo(0);
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-krishi-light/95 border border-krishi-green/20 flex items-center justify-center text-krishi-green shadow-xs group-hover:scale-105 transition-transform">
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

        {/* Desktop Nav Chapter Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.target}
              type="button"
              onClick={() => {
                hapticLight();
                if (onScrollTo) onScrollTo(link.progress);
              }}
              className="hover:text-krishi-green transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions & Language Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Interstellar Soundtrack Toggle (Hans Zimmer) */}
          <button
            type="button"
            onClick={() => {
              hapticLight();
              toggleFieldAudio((active) => setAudioActive(active));
            }}
            aria-label={audioActive ? "Pause Interstellar Soundtrack" : "Play Interstellar Main Theme by Hans Zimmer"}
            title={audioActive ? "Interstellar Theme Playing (Click to pause)" : "Play Interstellar Theme - Hans Zimmer"}
            className={`p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              audioActive
                ? "bg-emerald-100/90 border-emerald-400 text-emerald-800 shadow-2xs"
                : "bg-white/80 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {audioActive ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden lg:flex items-end gap-0.5 h-3">
                  <span className="w-0.5 bg-emerald-600 rounded-full animate-pulse h-2"></span>
                  <span className="w-0.5 bg-emerald-600 rounded-full animate-bounce h-3"></span>
                  <span className="w-0.5 bg-emerald-600 rounded-full animate-pulse h-1.5"></span>
                </span>
                <span className="hidden lg:inline text-[10px] uppercase font-mono tracking-wider">Interstellar</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[10px] uppercase font-mono tracking-wider text-slate-400">Music</span>
              </>
            )}
          </button>

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
  );
}
